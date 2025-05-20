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
  ensureUrlProtocol,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition
} from './utils';
import { AlightExternalLinkPluginConfig } from './link';
import type { LinkDecoratorDefinition } from './linkconfig';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-link_selected';
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

    // Add a schema definition for the organization name attribute
    editor.model.schema.extend('$text', { allowAttributes: 'alightExternalLinkPluginOrgName' });

    // Add a high-priority dataDowncast converter
    editor.conversion.for('dataDowncast')
      .attributeToElement({
        model: 'alightExternalLinkPluginHref',
        view: (href, conversionApi) => {
          if (!href) return null;
          const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;

          // Build attributes object with target and rel
          const attrs: Record<string, string> = {
            'target': '_blank',
            'rel': 'noopener noreferrer'
          };

          // Use the organization name from the link command if available
          if (linkCommand && linkCommand.organization) {
            attrs.orgnameattr = linkCommand.organization;
          }

          return createLinkElement(href, { ...conversionApi, attrs });
        },
        converterPriority: 'high'
      });

    // Add a high-priority editingDowncast converter
    editor.conversion.for('editingDowncast')
      .attributeToElement({
        model: 'alightExternalLinkPluginHref',
        view: (href, conversionApi) => {
          if (!href) return null;
          const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;

          // Build attributes object with target and rel
          const attrs: Record<string, string> = {
            'target': '_blank',
            'rel': 'noopener noreferrer'
          };

          // Use the organization name from the link command if available
          if (linkCommand && linkCommand.organization) {
            attrs.orgnameattr = linkCommand.organization;
          }

          return createLinkElement(ensureSafeUrl(href, allowedProtocols), { ...conversionApi, attrs });
        },
        converterPriority: 'high'
      });

    // Use the custom converter for organization names instead of attributeToAttribute
    this._setupOrganizationNameExtraction();

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

            // Filter links during upcast
            if (typeof href === 'string') {
              // Accept special editor links
              if (href.includes('~public_editor_id') || href.includes('~intranet_editor_id')) {
                return href;
              }

              // Accept regular http/https links
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

    // Add upcast converter for organization name attribute
    editor.conversion.for('upcast')
      .attributeToAttribute({
        view: {
          name: 'a',
          key: 'orgnameattr'
        },
        model: {
          key: 'alightExternalLinkPluginOrgName',
          value: (viewElement: ViewElement) => {
            return viewElement.getAttribute('orgnameattr');
          }
        }
      });

    // Enhanced upcast converter to extract organization names from link text
    editor.conversion.for('upcast').add(dispatcher => {
      dispatcher.on('element:a', (evt, data, conversionApi) => {
        // Skip if this is not an upcast process
        if (!conversionApi.consumable.test(data.viewItem, { name: true })) {
          return;
        }

        // Skip if no href attribute or if it's already been consumed
        if (!data.viewItem.hasAttribute('href') ||
          !conversionApi.consumable.test(data.viewItem, { attributes: ['href'] })) {
          return;
        }

        const href = data.viewItem.getAttribute('href');
        if (!href || typeof href !== 'string') {
          return;
        }

        // Only process http/https links (or legacy editor links)
        if (!(href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.includes('~public_editor_id') ||
          href.includes('~intranet_editor_id'))) {
          return;
        }

        // Check if the link already has an organization name attribute
        const hasOrgAttr = data.viewItem.hasAttribute('orgnameattr');

        // If it doesn't have an org attribute, try to extract it from the text content
        if (!hasOrgAttr) {
          // Get the text content of the link
          let linkText = '';
          for (const child of data.viewItem.getChildren()) {
            if (child.is('$text')) {
              linkText += child.data;
            }
          }

          // Look for text in the format "text (org name)"
          const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);
          if (match && match[2]) {
            const orgName = match[2];

            // Set the organization name attribute in the model
            conversionApi.writer.setAttribute('alightExternalLinkPluginOrgName', orgName, data.modelRange);
          }
        }
      });
    });

    // Run a post-processing step on all links to ensure organization names are properly handled
    editor.conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('insert:$text', (evt, data, conversionApi) => {
        // Skip if this is not a text node with a link
        if (!data.item.hasAttribute('alightExternalLinkPluginHref')) {
          return;
        }

        // Skip if the text node has already been consumed
        if (!conversionApi.consumable.test(data.item, 'insert')) {
          return;
        }

        // Get all attributes of the text node
        const href = data.item.getAttribute('alightExternalLinkPluginHref');
        const orgName = data.item.getAttribute('alightExternalLinkPluginOrgName');

        // If there's organization in the attribute but not in the text, add it to the text
        if (orgName && !data.item.data.includes(` (${orgName})`)) {
          // Only modify if it doesn't already have an organization in the text
          const match = data.item.data.match(/^(.*?)\s+\([^)]+\)$/);
          if (!match) {
            // Create the modified text with the organization name
            const text = data.item.data + ` (${orgName})`;

            // Map the model text to the view
            const viewWriter = conversionApi.writer;
            const viewPosition = conversionApi.mapper.toViewPosition(data.range.start);
            const viewElement = viewWriter.createText(text);

            // Insert the modified text
            viewWriter.insert(viewPosition, viewElement);

            // Consume the original text insertion
            conversionApi.consumable.consume(data.item, 'insert');

            evt.stop();
          }
        }
      }, { priority: 'high' });
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
   * Processes an array of configured manual decorators,
   * transforms them into ManualDecorator instances and stores them in the
   * AlightExternalLinkPluginCommand#manualDecorators collection (a model for manual decorators state).
   *
   * Also registers an attribute-to-element converter for each manual decorator 
   * and extends the model's schema with adequate model attributes.
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
   * Enhanced downcast converter for handling organization names
   * This should be added to the init() method of AlightExternalLinkPluginEditing
   */
  private _setupOrganizationNameExtraction(): void {
    const editor = this.editor;

    // Replace the attributeToAttribute converter with a custom downcast converter for organization names
    editor.conversion.for('downcast').add(dispatcher => {
      // When alightExternalLinkPluginOrgName attribute changes
      dispatcher.on('attribute:alightExternalLinkPluginOrgName', (evt, data, conversionApi) => {
        // Skip if we can't consume it
        if (!conversionApi.consumable.consume(data.item, evt.name)) {
          return;
        }

        // We only care about text nodes with the href attribute
        if (!data.item.is('$text') || !data.item.hasAttribute('alightExternalLinkPluginHref')) {
          return;
        }

        const viewWriter = conversionApi.writer;
        const orgName = data.attributeNewValue;

        // Get the existing 'a' element for this link in the view
        const viewRange = conversionApi.mapper.toViewRange(data.range);

        // Find the parent 'a' element
        let linkElement = null;
        for (const item of viewRange.getItems()) {
          if (item.is('$text')) {
            const parent = item.parent;
            if (parent && parent.is('element', 'a')) {
              linkElement = parent;
              break;
            }
          }
        }

        // If we found the link element, update its orgnameattr
        if (linkElement) {
          if (orgName) {
            viewWriter.setAttribute('orgnameattr', orgName, linkElement);
          } else {
            viewWriter.removeAttribute('orgnameattr', linkElement);
          }
        }
      });

      // We also need to handle the case where the href attribute changes
      dispatcher.on('attribute:alightExternalLinkPluginHref', (evt, data, conversionApi) => {
        // Since we've already handled this in our primary converter, 
        // just make sure org name is included if present
        if (data.item.is('$text') &&
          data.attributeNewValue &&
          data.item.hasAttribute('alightExternalLinkPluginOrgName')) {

          // Consume the org name attribute so it can be applied to the element
          conversionApi.consumable.consume(data.item, 'attribute:alightExternalLinkPluginOrgName');

          const viewRange = conversionApi.mapper.toViewRange(data.range);

          // Find the newly created 'a' element
          for (const item of viewRange.getItems()) {
            if (item.is('$text')) {
              const parent = item.parent;
              if (parent && parent.is('element', 'a')) {
                // Set the orgnameattr on the link element
                const orgName = data.item.getAttribute('alightExternalLinkPluginOrgName');
                conversionApi.writer.setAttribute('orgnameattr', orgName, parent);
                break;
              }
            }
          }
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
  writer.removeSelectionAttribute('alightExternalLinkPluginOrgName');

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
