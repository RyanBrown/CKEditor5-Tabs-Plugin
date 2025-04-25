// src/plugins/alight-new-document-link-plugin/linkediting.ts
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
  DocumentSelectionChangeAttributeEvent,
  DowncastConversionApi
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

import AlightNewDocumentLinkPluginCommand from './linkcommand';
import AlightNewDocumentUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  createLinkElement,
  ensureSafeUrl,
  getLocalizedDecorators,
  normalizeDecorators,
  addLinkProtocolIfApplicable,
  createBookmarkCallbacks,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition
} from './utils';
import { AlightNewDocumentLinkPluginConfig } from './link';
import type { LinkDecoratorDefinition } from './linkconfig';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;

/**
 * The new document link engine feature.
 *
 * It introduces the `alightNewDocumentLinkPluginHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'alight-new-document-link'` and `'alight-new-document-unlink'` commands.
 */
export default class AlightNewDocumentLinkPluginEditing extends Plugin {
  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightNewDocumentLinkPluginEditing' as const;
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
    editor.config.define('alightNewDocumentLink', {
      allowCreatingEmptyLinks: false,
      addTargetToExternalLinks: false,
      // Remove defaultProtocol setting
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
    const config = editor.config.get('alightNewDocumentLink') as AlightNewDocumentLinkPluginConfig;
    // Define allowed protocols - only http and https allowed by default
    const allowedProtocols = ['http', 'https'];

    // Allow link attribute on all inline nodes.
    editor.model.schema.extend('$text', { allowAttributes: 'alightNewDocumentLinkPluginHref' });

    // Add documentTitle attribute support
    editor.model.schema.extend('$text', { allowAttributes: 'documentTitle' });

    // Add a high-priority dataDowncast converter
    editor.conversion.for('dataDowncast')
      .attributeToElement({
        model: 'alightNewDocumentLinkPluginHref',
        view: (href, conversionApi) => {
          if (!href) return null;

          // Check if documentTitle attribute exists on the selection
          const documentTitle = editor.model.document.selection.getAttribute('documentTitle');

          // Log the downcast operation
          console.log('Downcasting link with href:', href, 'and documentTitle:', documentTitle);

          return createLinkElement(href, conversionApi, documentTitle as string | undefined);
        },
        converterPriority: 'high'
      });

    // Add a high-priority editingDowncast converter
    editor.conversion.for('editingDowncast')
      .attributeToElement({
        model: 'alightNewDocumentLinkPluginHref',
        view: (href, conversionApi) => {
          if (!href) return null;

          // Check if documentTitle attribute exists on the selection
          const documentTitle = editor.model.document.selection.getAttribute('documentTitle');

          // Log the downcast operation
          console.log('Editing downcast link with href:', href, 'and documentTitle:', documentTitle);

          return createLinkElement(ensureSafeUrl(href, allowedProtocols), conversionApi, documentTitle as string | undefined);
        },
        converterPriority: 'high'
      });

    // Upcast converter for document links
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            href: true,
            'data-id': 'new-document_link'
          }
        },
        model: {
          key: 'alightNewDocumentLinkPluginHref',
          value: (viewElement: ViewElement, conversionApi: DowncastConversionApi): string | null => {
            const href = viewElement.getAttribute('href');

            // Upcast document title if available
            const documentTitle = viewElement.getAttribute('data-document-title');
            if (documentTitle && viewElement.parent && viewElement.parent.is('element')) {
              // Add document title attribute to the model element
              // Only proceed if parent is an Element, not a DocumentFragment
              conversionApi.writer.setAttribute('documentTitle', documentTitle, viewElement.parent);
              console.log('Upcasting link with documentTitle:', documentTitle);
            }
            return href;
          }
        },
        converterPriority: 'normal'
      });

    // Additional upcast converter for document title attribute
    editor.conversion.for('upcast')
      .attributeToAttribute({
        view: {
          name: 'a',
          key: 'data-document-title'
        },
        model: {
          key: 'documentTitle',
          value: (viewElement: ViewElement) => {
            return viewElement.getAttribute('data-document-title');
          }
        }
      });

    // Create linking commands.
    editor.commands.add('alight-new-document-link', new AlightNewDocumentLinkPluginCommand(editor));
    editor.commands.add('alight-new-document-unlink', new AlightNewDocumentUnlinkCommand(editor));

    const decoratorsConfig = config?.decorators as Record<string, LinkDecoratorDefinition> || {};
    const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(decoratorsConfig));

    this._enableAutomaticDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorAutomaticDefinition => item.mode === DECORATOR_AUTOMATIC));
    this._enableManualDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorManualDefinition => item.mode === DECORATOR_MANUAL));

    // Enable two-step caret movement for `alightNewDocumentLinkPluginHref` attribute.
    const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
    twoStepCaretMovementPlugin.registerAttribute('alightNewDocumentLinkPluginHref');

    // Setup highlight over selected link with a unique class to avoid conflicts
    inlineHighlight(editor, 'alightNewDocumentLinkPluginHref', 'a', HIGHLIGHT_CLASS);

    // Handle link following by CTRL+click
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
   * **Note**: This method also activates the automatic new document link decorator if enabled with
   * {@link module:link/linkconfig~LinkConfig#addTargetToExternalLinks `config.alightNewDocumentLink.addTargetToExternalLinks`}.
   */
  private _enableAutomaticDecorators(automaticDecoratorDefinitions: Array<NormalizedLinkDecoratorAutomaticDefinition>): void {
    const editor = this.editor;
    // Store automatic decorators in the command instance as we do the same with manual decorators.
    // Thanks to that, `AlightNewDocumentLinkPluginImageEditing` plugin can re-use the same definitions.
    const command = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    const config = editor.config.get('alightNewDocumentLink') as AlightNewDocumentLinkPluginConfig;

    // Adds a default decorator for new document links.
    if (config?.addTargetToExternalLinks) {
      automaticDecorators.add({
        id: 'linkIsNewDocument',
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
   * Processes an array of configured manual decorators,
   * transforms them into ManualDecorator instances and stores them in the
   * AlightNewDocumentLinkPluginCommand#manualDecorators collection (a model for manual decorators state).
   *
   * Also registers an attribute-to-element converter for each manual decorator 
   * and extends the model's schema with adequate model attributes.
   */
  private _enableManualDecorators(manualDecoratorDefinitions: Array<NormalizedLinkDecoratorManualDefinition>): void {
    if (!manualDecoratorDefinitions.length) {
      return;
    }

    const editor = this.editor;
    const command = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand;
    const manualDecorators = command.manualDecorators;

    manualDecoratorDefinitions.forEach(decoratorDefinition => {
      editor.model.schema.extend('$text', { allowAttributes: decoratorDefinition.id });

      // Keeps reference to manual decorator to decode its name to attributes during downcast.
      const decorator = new ManualDecorator(decoratorDefinition);

      manualDecorators.add(decorator);

      editor.conversion.for('downcast').attributeToElement({
        model: decorator.id,
        view: (manualDecoratorValue, { writer, schema }, { item }) => {
          // Manual decorators for block links are handled e.g. in AlightNewDocumentLinkPluginImageEditing.
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

            writer.setCustomProperty('alight-new-document-link', true, element);

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
        // For document links, you might want to implement custom handling here
        console.log('Opening document link:', url);
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

      // Handle document links
      if (url.includes('/')) {
        evt.stop();
        data.preventDefault();
        handleLinkOpening(url);
      }
    }, { context: '$capture' });

    // Open link on Alt+Enter.
    this.listenTo<ViewDocumentKeyDownEvent>(viewDocument, 'keydown', (evt, data) => {
      const command = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand;
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
   * Watches the DocumentSelection attribute changes and removes link decorator attributes when the alightNewDocumentLinkPluginHref attribute is removed.
   *
   * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
   */
  private _enableSelectionAttributesFixer(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    this.listenTo<DocumentSelectionChangeAttributeEvent>(selection, 'change:attribute', (evt, { attributeKeys }) => {
      if (!attributeKeys.includes('alightNewDocumentLinkPluginHref') || selection.hasAttribute('alightNewDocumentLinkPluginHref')) {
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
    const config = editor.config.get('alightNewDocumentLink') as AlightNewDocumentLinkPluginConfig;
    const defaultProtocol = config?.defaultProtocol ||
      (editor.config.get('link.defaultProtocol') as string | undefined);

    if (!defaultProtocol) {
      return;
    }

    this.listenTo<ClipboardContentInsertionEvent>(editor.plugins.get('ClipboardPipeline'), 'contentInsertion', (evt, data) => {
      model.change(writer => {
        const range = writer.createRangeIn(data.content);

        for (const item of range.getItems()) {
          if (item.hasAttribute('alightNewDocumentLinkPluginHref')) {
            const href = item.getAttribute('alightNewDocumentLinkPluginHref');
            if (typeof href !== 'string') continue;

            const newLink = addLinkProtocolIfApplicable(href, defaultProtocol);
            writer.setAttribute('alightNewDocumentLinkPluginHref', newLink, item);
          }
        }
      });
    });
  }
}

/**
 * Make the selection free of link-related model attributes.
 * All link-related model attributes start with "link". That includes not only "alightNewDocumentLinkPluginHref"
 * but also all decorator attributes (they have dynamic names), or even custom plugins.
 */
function removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
  writer.removeSelectionAttribute('alightNewDocumentLinkPluginHref');

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
    typeof attribute === 'string' && attribute.startsWith('link')
  );
}
