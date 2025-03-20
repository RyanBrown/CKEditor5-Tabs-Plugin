// src/plugins/alight-external-link-plugin/linkediting.ts
import {
  Plugin,
  type Editor
} from '@ckeditor/ckeditor5-core';
import type {
  Schema,
  Writer,
  ViewElement,
  ViewDocumentKeyDownEvent,
  ViewDocumentClickEvent,
  DocumentSelectionChangeAttributeEvent
} from '@ckeditor/ckeditor5-engine';
import {
  Input,
  TwoStepCaretMovement,
  inlineHighlight
} from '@ckeditor/ckeditor5-typing';
import {
  ClipboardPipeline,
  type ClipboardContentInsertionEvent
} from '@ckeditor/ckeditor5-clipboard';
import { keyCodes, env } from '@ckeditor/ckeditor5-utils';

import AlightExternalLinkPluginCommand from './linkcommand';
import AlightExternalUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  createLinkElement,
  ensureSafeUrl,
  getLocalizedDecorators,
  normalizeDecorators,
  addLinkProtocolIfApplicable,
  createBookmarkCallbacks,
  openLink,
  ensureUrlProtocol,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition
} from './utils';
import { AlightExternalLinkPluginConfig } from './link';
import type { LinkDecoratorDefinition } from './linkconfig';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-alight-external-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;

/**
 * The external link engine feature.
 *
 * It introduces the `alightExternalLinkPluginHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'alight-external-link'` and `'alight-external-unlink'` commands.
 */
export default class AlightExternalLinkPluginEditing extends Plugin {
  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkPluginEditing' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }

  /**
   * @inheritDoc
   */
  public static get requires() {
    // Clipboard is required for handling cut and paste events while typing over the link.
    return [TwoStepCaretMovement, Input, ClipboardPipeline] as const;
  }

  /**
   * @inheritDoc
   */
  constructor(editor: Editor) {
    super(editor);

    // Use a separate config namespace to avoid conflicts with standard link plugin
    editor.config.define('alightExternalLink', {
      allowCreatingEmptyLinks: false,
      addTargetToExternalLinks: false,
      defaultProtocol: 'https://',
      toolbar: {
        shouldAppearInToolbar: true
      }
    });
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const config = editor.config.get('alightExternalLink') as AlightExternalLinkPluginConfig;
    // Only allow http and https protocols
    const allowedProtocols = ['https?'];

    // Allow link attribute on all inline nodes.
    editor.model.schema.extend('$text', { allowAttributes: 'alightExternalLinkPluginHref' });

    // Add a high-priority dataDowncast converter
    editor.conversion.for('dataDowncast')
      .attributeToElement({
        model: 'alightExternalLinkPluginHref',
        view: createLinkElement,
        converterPriority: 'high'
      });

    // Add a high-priority editingDowncast converter
    editor.conversion.for('editingDowncast')
      .attributeToElement({
        model: 'alightExternalLinkPluginHref',
        view: (href, conversionApi) => {
          return createLinkElement(ensureSafeUrl(href, allowedProtocols), conversionApi);
        },
        converterPriority: 'high'
      });

    // Upcast converter for all links - we'll filter non-HTTP/HTTPS later
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            href: true
          }
        },
        model: {
          key: 'alightExternalLinkPluginHref',
          value: (viewElement: ViewElement) => {
            const href = viewElement.getAttribute('href');

            // Filter out non-HTTP/HTTPS URLs during upcast
            if (typeof href === 'string') {
              if (href.startsWith('http://') || href.startsWith('https://')) {
                return href;
              } else if (/^www\..+$/i.test(href)) {
                // For www. links, add the protocol
                return ensureUrlProtocol(href);
              }
              // Otherwise, return null to skip this link
              return null;
            }
            return null;
          }
        },
        converterPriority: 'normal'
      });

    // Create linking commands.
    editor.commands.add('alight-external-link', new AlightExternalLinkPluginCommand(editor));
    editor.commands.add('alight-external-unlink', new AlightExternalUnlinkCommand(editor));

    const decoratorsConfig = config?.decorators as Record<string, LinkDecoratorDefinition> || {};
    const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(decoratorsConfig));

    this._enableAutomaticDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorAutomaticDefinition => item.mode === DECORATOR_AUTOMATIC));
    this._enableManualDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorManualDefinition => item.mode === DECORATOR_MANUAL));

    // Enable two-step caret movement for `alightExternalLinkPluginHref` attribute.
    const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
    twoStepCaretMovementPlugin.registerAttribute('alightExternalLinkPluginHref');

    // Setup highlight over selected link with a unique class to avoid conflicts
    inlineHighlight(editor, 'alightExternalLinkPluginHref', 'a', HIGHLIGHT_CLASS);

    // Handle link following by CTRL+click or ALT+ENTER
    this._enableLinkOpen();

    // Clears the DocumentSelection decorator attributes if the selection is no longer in a link (for example while using 2-SCM).
    this._enableSelectionAttributesFixer();

    // Handle adding default protocol to pasted links.
    this._enableClipboardIntegration();
  }

  /**
   * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators}
   * and registers a {@link module:engine/conversion/downcastdispatcher~DowncastDispatcher downcast dispatcher}
   * for each one of them. Downcast dispatchers are obtained using the
   * {@link module:link/utils/automaticdecorators~AutomaticDecorators#getDispatcher} method.
   *
   * **Note**: This method also activates the automatic external link decorator if enabled with
   * {@link module:link/linkconfig~LinkConfig#addTargetToExternalLinks `config.alightExternalLink.addTargetToExternalLinks`}.
   */
  private _enableAutomaticDecorators(automaticDecoratorDefinitions: Array<NormalizedLinkDecoratorAutomaticDefinition>): void {
    const editor = this.editor;
    // Store automatic decorators in the command instance as we do the same with manual decorators.
    // Thanks to that, `AlightExternalLinkPluginImageEditing` plugin can re-use the same definitions.
    const command = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    const config = editor.config.get('alightExternalLink') as AlightExternalLinkPluginConfig;

    // Adds a default decorator for external links.
    if (config?.addTargetToExternalLinks) {
      automaticDecorators.add({
        id: 'linkIsExternal',
        mode: DECORATOR_AUTOMATIC,
        callback: url => !!url && EXTERNAL_LINKS_REGEXP.test(url),
        attributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      });
    }

    automaticDecorators.add(automaticDecoratorDefinitions);

    if (automaticDecorators.length) {
      editor.conversion.for('downcast').add(automaticDecorators.getDispatcher());
    }
  }

  /**
   * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorManualDefinition manual decorators},
   * transforms them into {@link module:link/utils/manualdecorator~ManualDecorator} instances and stores them in the
   * {@link module:link/AlightExternalLinkPluginCommand~AlightExternalLinkPluginCommand#manualDecorators} collection (a model for manual decorators state).
   *
   * Also registers an {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement attribute-to-element}
   * converter for each manual decorator and extends the {@link module:engine/model/schema~Schema model's schema}
   * with adequate model attributes.
   */
  private _enableManualDecorators(manualDecoratorDefinitions: Array<NormalizedLinkDecoratorManualDefinition>): void {
    if (!manualDecoratorDefinitions.length) {
      return;
    }

    const editor = this.editor;
    const command = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;
    const manualDecorators = command.manualDecorators;

    manualDecoratorDefinitions.forEach(decoratorDefinition => {
      editor.model.schema.extend('$text', { allowAttributes: decoratorDefinition.id });

      // Keeps reference to manual decorator to decode its name to attributes during downcast.
      const decorator = new ManualDecorator(decoratorDefinition);

      manualDecorators.add(decorator);

      editor.conversion.for('downcast').attributeToElement({
        model: decorator.id,
        view: (manualDecoratorValue, { writer, schema }, { item }) => {
          // Manual decorators for block links are handled e.g. in AlightExternalLinkPluginImageEditing.
          if (!(item.is('selection') || schema.isInline(item))) {
            return;
          }

          if (manualDecoratorValue) {
            const element = writer.createAttributeElement('a', decorator.attributes || {}, { priority: 5 });

            if (decorator.classes) {
              writer.addClass(decorator.classes, element);
            }

            if (decorator.styles) {
              for (const key in decorator.styles) {
                writer.setStyle(key, decorator.styles[key], element);
              }
            }

            writer.setCustomProperty('alight-external-link', true, element);

            return element;
          }
        }
      });

      editor.conversion.for('upcast').elementToAttribute({
        view: {
          name: 'a',
          ...(decorator._createPattern?.() || {})
        },
        model: {
          key: decorator.id
        }
      });
    });
  }

  /**
   * Attaches handlers for {@link module:engine/view/document~Document#event:enter} and
   * {@link module:engine/view/document~Document#event:click} to enable link following.
   */
  private _enableLinkOpen(): void {
    const editor = this.editor;
    const view = editor.editing.view;
    const viewDocument = view.document;
    const bookmarkCallbacks = createBookmarkCallbacks(editor);

    function handleLinkOpening(url: string): void {
      if (bookmarkCallbacks.isScrollableToTarget(url)) {
        bookmarkCallbacks.scrollToTarget(url);
      } else {
        openLink(url);
      }
    }

    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', (evt, data) => {
      const shouldOpen = env.isMac ? data.domEvent.metaKey : data.domEvent.ctrlKey;

      if (!shouldOpen) {
        return;
      }

      const clickedElement = data.domTarget as Element;

      if (!clickedElement) {
        return;
      }

      let linkElement = clickedElement;
      if (clickedElement.tagName.toLowerCase() != 'a') {
        linkElement = clickedElement.closest('a') as Element;
      }

      if (!linkElement) {
        return;
      }

      const url = linkElement.getAttribute('href');

      if (!url || typeof url !== 'string') {
        return;
      }

      evt.stop();
      data.preventDefault();

      handleLinkOpening(url);
    }, { context: '$capture' });

    // Open link on Alt+Enter.
    this.listenTo<ViewDocumentKeyDownEvent>(viewDocument, 'keydown', (evt, data) => {
      const command = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;
      const url = command.value;
      const shouldOpen = !!url && data.keyCode === keyCodes.enter && data.altKey;

      if (!shouldOpen) {
        return;
      }

      evt.stop();

      handleLinkOpening(url);
    });
  }

  /**
   * Watches the DocumentSelection attribute changes and removes link decorator attributes when the alightExternalLinkPluginHref attribute is removed.
   *
   * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
   */
  private _enableSelectionAttributesFixer(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    this.listenTo<DocumentSelectionChangeAttributeEvent>(selection, 'change:attribute', (evt, { attributeKeys }) => {
      if (!attributeKeys.includes('alightExternalLinkPluginHref') || selection.hasAttribute('alightExternalLinkPluginHref')) {
        return;
      }

      model.change(writer => {
        removeLinkAttributesFromSelection(writer, getLinkAttributesAllowedOnText(model.schema));
      });
    });
  }

  /**
   * Enables URL fixing on pasting.
   */
  private _enableClipboardIntegration(): void {
    const editor = this.editor;
    const model = editor.model;
    const config = editor.config.get('alightExternalLink') as AlightExternalLinkPluginConfig;
    const defaultProtocol = config?.defaultProtocol ||
      (editor.config.get('link.defaultProtocol') as string | undefined);

    if (!defaultProtocol) {
      return;
    }

    this.listenTo<ClipboardContentInsertionEvent>(editor.plugins.get('ClipboardPipeline'), 'contentInsertion', (evt, data) => {
      model.change(writer => {
        const range = writer.createRangeIn(data.content);

        for (const item of range.getItems()) {
          if (item.hasAttribute('alightExternalLinkPluginHref')) {
            const href = item.getAttribute('alightExternalLinkPluginHref');
            if (typeof href !== 'string') continue;

            const newLink = addLinkProtocolIfApplicable(href, defaultProtocol);
            writer.setAttribute('alightExternalLinkPluginHref', newLink, item);
          }
        }
      });
    });
  }
}

/**
 * Make the selection free of link-related model attributes.
 * All link-related model attributes start with "link" or "alightExternal". That includes not only "alightExternalLinkPluginHref"
 * but also all decorator attributes (they have dynamic names), or even custom plugins.
 */
function removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
  writer.removeSelectionAttribute('alightExternalLinkPluginHref');

  for (const attribute of linkAttributes) {
    writer.removeSelectionAttribute(attribute);
  }
}

/**
 * Returns an array containing names of the attributes allowed on `$text` that describes the link item.
 */
function getLinkAttributesAllowedOnText(schema: Schema): Array<string> {
  const textAttributes = schema.getDefinition('$text')?.allowAttributes || [];

  return textAttributes.filter(attribute =>
    typeof attribute === 'string' &&
    (attribute.startsWith('link') || attribute.startsWith('alightExternal'))
  );
}
