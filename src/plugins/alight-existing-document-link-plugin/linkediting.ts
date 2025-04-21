// src/plugins/alight-existing-document-link/linkediting.ts
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

import AlightExistingDocumentLinkPluginCommand from './linkcommand';
import AlightExistingDocumentLinkPluginUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  createLinkElement,
  ensureSafeUrl,
  getLocalizedDecorators,
  normalizeDecorators,
  addLinkProtocolIfApplicable,
  createBookmarkCallbacks,
  extractExternalDocumentLinkId,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition,
} from './utils';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;

/**
 * The link engine feature.
 *
 * It introduces the `AlightExistingDocumentLinkPluginHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'link'` and `'unlink'` commands.
 */
export default class AlightExistingDocumentLinkPluginEditing extends Plugin {
  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExistingDocumentLinkPluginEditing' as const;
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

    editor.config.define('link', {
      allowCreatingEmptyLinks: false,
      addTargetToExternalLinks: false
    });
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const allowedProtocols = this.editor.config.get('link.allowedProtocols');

    // Allow link attribute on all inline nodes.
    editor.model.schema.extend('$text', { allowAttributes: 'AlightExistingDocumentLinkPluginHref' });

    // For storing additional link data
    editor.model.schema.extend('$text', { allowAttributes: 'AlightExistingDocumentPluginLinkName' });
    editor.model.schema.extend('$text', { allowAttributes: 'AlightExistingDocumentLinkPluginFormat' });

    // Allow orgnameattr attribute to be present, so we can remove it later
    editor.model.schema.extend('$text', { allowAttributes: 'orgnameattr' });

    // Create a reusable link creation function for both data and editing downcast converters
    const createLinkElementForDowncast = (href: string, conversionApi: any) => {
      // If there's no href, don't create a link element
      if (!href || href === '') {
        return null;
      }

      // Safely handle null or undefined href
      const hrefValue = href || '';

      // Extract the link ID or generate one if needed
      const linkId = extractExternalDocumentLinkId(hrefValue) || ''; // Default is empty if none found

      // Define all required attributes
      const attributes = {
        'href': linkId,
        'data-id': 'existing-document_link',
        'data-format': 'existingDocumentTag',
        'data-link-name': linkId,
        'target': '_blank' // Only add target attribute when we have href
      };

      // Create the link element
      const linkElement = conversionApi.writer.createAttributeElement('a', attributes, { priority: 5 });

      // Add the required class
      conversionApi.writer.addClass('document_tag', linkElement);

      // Set custom property for link identification
      conversionApi.writer.setCustomProperty('alight-existing-document-link', true, linkElement);

      return linkElement;
    };

    // Setup both data and editing downcast converters using the common function
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'AlightExistingDocumentLinkPluginHref',
      view: (href, conversionApi) => {
        // Skip conversion if no href is provided
        if (!href) {
          return null;
        }
        return createLinkElementForDowncast(href, conversionApi);
      }
    });

    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'AlightExistingDocumentLinkPluginHref',
      view: (href, conversionApi) => {
        // Skip conversion if no href is provided
        if (!href) {
          return null;
        }
        return createLinkElementForDowncast(href, conversionApi);
      }
    });

    // Handle existing document links and standard links
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            'href': true,
            'data-cke-saved-href': true
          }
        },
        model: {
          key: 'AlightExistingDocumentLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // First check if it's a existing document link with data-id attribute
            const dataId = viewElement.getAttribute('data-id');
            const dataLinkName = viewElement.getAttribute('data-link-name');

            // Always add target="_blank" for links during upcast
            viewElement._setAttribute('target', '_blank');

            if (dataId === 'existing document_link' && dataLinkName) {
              // If it has existing document link attributes, use the link name as href
              return dataLinkName;
            }

            // Otherwise get the actual href (prefer data-cke-saved-href if available)
            const savedHref = viewElement.getAttribute('data-cke-saved-href');
            const href = savedHref || viewElement.getAttribute('href');

            // If it's empty or just #, and not a existing document link, don't create a link
            if ((href === '' || href === '#') && !viewElement.hasClass('document_tag')) {
              return false; // This will prevent the attribute from being set
            }

            return href;
          }
        },
        converterPriority: 'high'
      });

    // Custom document_tag format with ah:link element inside
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: 'document_tag'
        },
        model: {
          key: 'AlightExistingDocumentLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Always add target="_blank" to links during upcast
            viewElement._setAttribute('target', '_blank');

            // Try to find ah:link element inside
            const ahLink = viewElement.getChild(0);
            if (ahLink && ahLink.is('element', 'ah:link')) {
              const linkName = ahLink.getAttribute('name');

              // Check for orgnameattr attribute on the ah:link element
              const orgnameattr = ahLink.getAttribute('orgnameattr');
              if (orgnameattr !== undefined) {
                // We need to use the after conversion hook, not direct model.change
                this.editor.model.once('_afterConversion', () => {
                  this.editor.model.change(writer => {
                    const selection = this.editor.model.document.selection;
                    const range = selection.getFirstRange();

                    if (range) {
                      writer.setAttribute('orgnameattr', orgnameattr, range);
                    }
                  });
                });
              }

              // Store additional information for document_tag format
              // We need to use the after conversion hook, not direct model.change
              const format = 'existingDocumentTag';
              const name = linkName;
              this.editor.model.once('_afterConversion', () => {
                this.editor.model.change(writer => {
                  const selection = this.editor.model.document.selection;
                  const range = selection.getFirstRange();

                  if (range) {
                    writer.setAttribute('AlightExistingDocumentLinkPluginFormat', format, range);
                    writer.setAttribute('AlightExistingDocumentPluginLinkName', name, range);
                  }
                });
              });

              // Return the link name as the href without adding any suffix
              return linkName;
            }

            // Fallback to standard href
            return viewElement.getAttribute('href');
          }
        },
        converterPriority: 'highest' // Higher priority than standard link converter
      });

    // Create linking commands.
    editor.commands.add('alight-existing-document-link', new AlightExistingDocumentLinkPluginCommand(editor));
    editor.commands.add('alight-existing-document-unlink', new AlightExistingDocumentLinkPluginUnlinkCommand(editor));

    const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(editor.config.get('link.decorators')));

    this._enableAutomaticDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorAutomaticDefinition => item.mode === DECORATOR_AUTOMATIC));
    this._enableManualDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorManualDefinition => item.mode === DECORATOR_MANUAL));

    // Enable two-step caret movement for `AlightExistingDocumentLinkPluginHref` attribute.
    const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
    twoStepCaretMovementPlugin.registerAttribute('AlightExistingDocumentLinkPluginHref');

    // Setup highlight over selected link.
    inlineHighlight(editor, 'AlightExistingDocumentLinkPluginHref', 'a', HIGHLIGHT_CLASS);

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
   * {@link module:link/linkconfig~LinkConfig#addTargetToExternalLinks `config.link.addTargetToExternalLinks`}.
   */
  private _enableAutomaticDecorators(automaticDecoratorDefinitions: Array<NormalizedLinkDecoratorAutomaticDefinition>): void {
    const editor = this.editor;
    // Store automatic decorators in the command instance as we do the same with manual decorators.
    // Thanks to that, `AlightExistingDocumentPluginImageEditing` plugin can re-use the same definitions.
    const command = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    automaticDecorators.add(automaticDecoratorDefinitions);

    if (automaticDecorators.length) {
      editor.conversion.for('downcast').add(automaticDecorators.getDispatcher());
    }
  }

  /**
   * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorManualDefinition manual decorators},
   * transforms them into {@link module:link/utils/manualdecorator~ManualDecorator} instances and stores them in the
   * {@link module:link/AlightExistingDocumentPluginCommand~AlightExistingDocumentPluginCommand#manualDecorators} collection (a model for manual decorators state).
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
    const command = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;
    const manualDecorators = command.manualDecorators;

    manualDecoratorDefinitions.forEach(decoratorDefinition => {
      editor.model.schema.extend('$text', { allowAttributes: decoratorDefinition.id });

      // Keeps reference to manual decorator to decode its name to attributes during downcast.
      const decorator = new ManualDecorator(decoratorDefinition);

      manualDecorators.add(decorator);

      editor.conversion.for('downcast').attributeToElement({
        model: decorator.id,
        view: (manualDecoratorValue, { writer, schema }, { item }) => {
          // Manual decorators for block links are handled e.g. in AlightExistingDocumentPluginImageEditing.
          if (!(item.is('selection') || schema.isInline(item))) {
            return;
          }

          if (manualDecoratorValue) {
            const element = writer.createAttributeElement('a', decorator.attributes, { priority: 5 });

            if (decorator.classes) {
              writer.addClass(decorator.classes, element);
            }

            for (const key in decorator.styles) {
              writer.setStyle(key, decorator.styles[key], element);
            }

            writer.setCustomProperty('alight-existing-document-link', true, element);

            return element;
          }
        }
      });

      editor.conversion.for('upcast').elementToAttribute({
        view: {
          name: 'a',
          ...decorator._createPattern()
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
      }
    }

    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', (evt, data) => {
      const shouldOpen = env.isMac ? data.domEvent.metaKey : data.domEvent.ctrlKey;

      if (!shouldOpen) {
        return;
      }

      let clickedElement: Element | null = data.domTarget;

      if (clickedElement.tagName.toLowerCase() != 'a') {
        clickedElement = clickedElement.closest('a');
      }

      if (!clickedElement) {
        return;
      }

      const url = clickedElement.getAttribute('href');

      if (!url) {
        return;
      }

      evt.stop();
      data.preventDefault();

      handleLinkOpening(url);
    }, { context: '$capture' });

    // Open link on Alt+Enter.
    this.listenTo<ViewDocumentKeyDownEvent>(viewDocument, 'keydown', (evt, data) => {
      const command = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;
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
   * Watches the DocumentSelection attribute changes and removes link decorator attributes when the AlightExistingDocumentLinkPluginHref attribute is removed.
   *
   * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
   */
  private _enableSelectionAttributesFixer(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    this.listenTo<DocumentSelectionChangeAttributeEvent>(selection, 'change:attribute', (evt, { attributeKeys }) => {
      if (!attributeKeys.includes('AlightExistingDocumentLinkPluginHref') || selection.hasAttribute('AlightExistingDocumentLinkPluginHref')) {
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
    const defaultProtocol = this.editor.config.get('link.defaultProtocol');

    if (!defaultProtocol) {
      return;
    }

    this.listenTo<ClipboardContentInsertionEvent>(editor.plugins.get('ClipboardPipeline'), 'contentInsertion', (evt, data) => {
      model.change(writer => {
        const range = writer.createRangeIn(data.content);

        for (const item of range.getItems()) {
          if (item.hasAttribute('AlightExistingDocumentLinkPluginHref')) {
            const newLink = addLinkProtocolIfApplicable(item.getAttribute('AlightExistingDocumentLinkPluginHref') as string, defaultProtocol);

            writer.setAttribute('AlightExistingDocumentLinkPluginHref', newLink, item);
          }
        }
      });
    });
  }
}

/**
 * Make the selection free of link-related model attributes.
 * All link-related model attributes start with "link". That includes not only "AlightExistingDocumentLinkPluginHref"
 * but also all decorator attributes (they have dynamic names), or even custom plugins.
 */
function removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
  writer.removeSelectionAttribute('AlightExistingDocumentLinkPluginHref');
  writer.removeSelectionAttribute('AlightExistingDocumentPluginLinkName');
  writer.removeSelectionAttribute('AlightExistingDocumentLinkPluginFormat');

  for (const attribute of linkAttributes) {
    writer.removeSelectionAttribute(attribute);
  }
}

/**
 * Returns an array containing names of the attributes allowed on `$text` that describes the link item.
 */
function getLinkAttributesAllowedOnText(schema: Schema): Array<string> {
  const textAttributes = schema.getDefinition('$text')!.allowAttributes;

  return textAttributes.filter(attribute => attribute.startsWith('link'));
}
