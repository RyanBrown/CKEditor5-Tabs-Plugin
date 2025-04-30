// src/plugins/alight-predefined-link-plugin/linkediting.ts
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

import AlightPredefinedLinkPluginCommand from './linkcommand';
import AlightPredefinedLinkPluginUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  createLinkElement,
  ensureSafeUrl,
  getLocalizedDecorators,
  normalizeDecorators,
  addLinkProtocolIfApplicable,
  createBookmarkCallbacks,
  extractPredefinedLinkId,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition
} from './utils';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;

/**
 * The link engine feature.
 *
 * It introduces the `alightPredefinedLinkPluginHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'link'` and `'unlink'` commands.
 */
export default class AlightPredefinedLinkPluginEditing extends Plugin {
  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginEditing' as const;
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
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginHref' });

    // For storing additional link data
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginLinkName' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginFormat' });

    // Allow attributes for onclick and destination
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginAttributeValue' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginDestination' });

    // Allow orgnameattr attribute to be present, so we can remove it later
    editor.model.schema.extend('$text', { allowAttributes: 'orgnameattr' });

    // Define downcast converter for data and editing
    const createDowncastConverter = (attributeValue: string, conversionApi: any) => {
      // Extract link details
      const href = attributeValue || '';
      const item = conversionApi.item;

      // Get or determine link name
      let linkName = '';
      if (item && item.hasAttribute && item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
        linkName = item.getAttribute('alightPredefinedLinkPluginLinkName');
      } else {
        linkName = extractPredefinedLinkId(href) || href;
      }

      // Create link element as attribute element with href set to linkName
      const linkElement = conversionApi.writer.createAttributeElement('a', {
        'href': linkName || '#',
        'class': 'AHCustomeLink',
        'data-id': 'predefined_link'
      }, {
        priority: 5
      });

      // Set custom property for identification
      conversionApi.writer.setCustomProperty('alight-predefined-link', true, linkElement);

      return linkElement;
    };

    // For data downcast to produce <a href="${link.predefinedLinkName}" class="AHCustomeLink" data-id="predefined_link">predefined link</a>
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: createDowncastConverter
    });

    // For editing view to produce the same structure
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: createDowncastConverter
    });

    // Add a downcast handler to create the second <a> element with onclick for data downcast
    editor.conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if the first converter has already consumed this
        if (conversionApi.consumable.test(data.item, evt.name) === false) {
          return;
        }

        // Get the attributes we need
        const onclickValue = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginAttributeValue') ?
          data.item.getAttribute('alightPredefinedLinkPluginAttributeValue') : 'javascript:void(0);';
        const destination = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginDestination') ?
          data.item.getAttribute('alightPredefinedLinkPluginDestination') : (data.attributeNewValue || '#');

        // Create the second anchor element with onclick
        const secondLinkElement = conversionApi.writer.createAttributeElement('a', {
          'href': destination,
          'onclick': onclickValue
        }, {
          priority: 6  // Higher priority to nest after the first link
        });

        // Apply this element to the same range
        if (data.item.is('selection')) {
          const range = conversionApi.writer.document.selection.getFirstRange();
          if (range) {
            conversionApi.writer.wrap(range, secondLinkElement);
          }
        } else {
          const range = conversionApi.mapper.toViewRange(data.range);
          conversionApi.writer.wrap(range, secondLinkElement);
        }
      }, { priority: 'low' });  // Lower priority than the attribute-to-element converter
    });

    // Handle upcast from <a href="#" class="AHCustomeLink"></a><a href="${link.destination}" onclick="${link.attributeValue}">predefined link</a>
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            'onclick': true
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Check if this is inside or adjacent to an AHCustomeLink element
            const parent = viewElement.parent;
            const onclickValue = viewElement.getAttribute('onclick') || '';
            const destination = viewElement.getAttribute('href') || '';
            let linkName = '';

            // Look for nearby AHCustomeLink element to extract the linkName
            if (parent) {
              const index = parent.getChildIndex(viewElement);
              // Try previous sibling
              if (index > 0) {
                const prevSibling = parent.getChild(index - 1);
                if (prevSibling && prevSibling.is('element', 'a') &&
                  prevSibling.hasClass('AHCustomeLink')) {
                  linkName = prevSibling.getAttribute('href') || '';
                }
              }
              // Try children of this element
              if (!linkName) {
                const children = Array.from(viewElement.getChildren());
                const textContent = children
                  .filter(child => child.is('$text'))
                  .map(child => child.data)
                  .join('');
                if (textContent.trim()) {
                  linkName = textContent.trim();
                }
              }
            }

            // If we couldn't find a linkName, use the destination or onclick as a fallback
            if (!linkName) {
              linkName = extractPredefinedLinkId(destination) || extractPredefinedLinkId(onclickValue) || '';
            }

            // Store additional information for the link format
            this.editor.model.once('_afterConversion', () => {
              this.editor.model.change(writer => {
                const selection = this.editor.model.document.selection;
                const range = selection.getFirstRange();

                if (range) {
                  writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                  writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
                  writer.setAttribute('alightPredefinedLinkPluginAttributeValue', onclickValue, range);
                  writer.setAttribute('alightPredefinedLinkPluginDestination', destination, range);
                }
              });
            });

            return linkName || '';
          }
        },
        converterPriority: 'high'
      });

    // Also handle the AHCustomeLink element during upcast
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: 'AHCustomeLink'
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Extract the linkName from href
            const linkName = viewElement.getAttribute('href') || '';

            // Look for adjacent anchor with onclick
            const parent = viewElement.parent;
            let onclickValue = '';
            let destination = '';

            if (parent) {
              const index = parent.getChildIndex(viewElement);
              // Try next sibling
              if (index < parent.childCount - 1) {
                const nextSibling = parent.getChild(index + 1);
                if (nextSibling && nextSibling.is('element', 'a') &&
                  nextSibling.hasAttribute('onclick')) {
                  onclickValue = nextSibling.getAttribute('onclick') || '';
                  destination = nextSibling.getAttribute('href') || '';
                }
              }
            }

            // Store additional information
            this.editor.model.once('_afterConversion', () => {
              this.editor.model.change(writer => {
                const selection = this.editor.model.document.selection;
                const range = selection.getFirstRange();

                if (range) {
                  writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                  writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
                  if (onclickValue) {
                    writer.setAttribute('alightPredefinedLinkPluginAttributeValue', onclickValue, range);
                  }
                  if (destination) {
                    writer.setAttribute('alightPredefinedLinkPluginDestination', destination, range);
                  }
                }
              });
            });

            return linkName || '';
          }
        },
        converterPriority: 'highest'
      });

    // Create linking commands.
    editor.commands.add('alight-predefined-link', new AlightPredefinedLinkPluginCommand(editor));
    editor.commands.add('alight-predefined-unlink', new AlightPredefinedLinkPluginUnlinkCommand(editor));

    const linkDecorators = getLocalizedDecorators(editor.t, normalizeDecorators(editor.config.get('link.decorators')));

    this._enableAutomaticDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorAutomaticDefinition => item.mode === DECORATOR_AUTOMATIC));
    this._enableManualDecorators(linkDecorators
      .filter((item): item is NormalizedLinkDecoratorManualDefinition => item.mode === DECORATOR_MANUAL));

    // Enable two-step caret movement for `alightPredefinedLinkPluginHref` attribute.
    const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);
    twoStepCaretMovementPlugin.registerAttribute('alightPredefinedLinkPluginHref');

    // Setup highlight over selected link.
    inlineHighlight(editor, 'alightPredefinedLinkPluginHref', 'a', HIGHLIGHT_CLASS);

    // Handle link following by CTRL+click or ALT+ENTER
    this._enableLinkOpen();

    // Clears the DocumentSelection decorator attributes if the selection is no longer in a link (for example while using 2-SCM).
    this._enableSelectionAttributesFixer();

    // Handle adding default protocol to pasted links.
    this._enableClipboardIntegration();
  }

  /**
   * Helper function to check if the URL is a predefined link 
   * This is added here to avoid circular dependency
   */
  private isPredefinedLink(url: string | null | undefined): boolean {
    // If the URL is empty, null, or undefined, it's not a predefined link
    if (!url) return false;

    return true;
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
    // Thanks to that, `AlightPredefinedLinkPluginImageEditing` plugin can re-use the same definitions.
    const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    automaticDecorators.add(automaticDecoratorDefinitions);

    if (automaticDecorators.length) {
      editor.conversion.for('downcast').add(automaticDecorators.getDispatcher());
    }
  }

  /**
   * Processes an array of configured {@link module:link/linkconfig~LinkDecoratorManualDefinition manual decorators},
   * transforms them into {@link module:link/utils/manualdecorator~ManualDecorator} instances and stores them in the
   * {@link module:link/AlightPredefinedLinkPluginCommand~AlightPredefinedLinkPluginCommand#manualDecorators} collection (a model for manual decorators state).
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
    const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const manualDecorators = command.manualDecorators;

    manualDecoratorDefinitions.forEach(decoratorDefinition => {
      editor.model.schema.extend('$text', { allowAttributes: decoratorDefinition.id });

      // Keeps reference to manual decorator to decode its name to attributes during downcast.
      const decorator = new ManualDecorator(decoratorDefinition);

      manualDecorators.add(decorator);

      editor.conversion.for('downcast').attributeToElement({
        model: decorator.id,
        view: (manualDecoratorValue, { writer, schema }, { item }) => {
          // Manual decorators for block links are handled e.g. in AlightPredefinedLinkPluginImageEditing.
          if (!(item.is('selection') || schema.isInline(item))) {
            return;
          }

          if (manualDecoratorValue) {
            // Create element with decorator attributes
            const element = writer.createAttributeElement('a', decorator.attributes, { priority: 5 });

            if (decorator.classes) {
              writer.addClass(decorator.classes, element);
            }

            for (const key in decorator.styles) {
              writer.setStyle(key, decorator.styles[key], element);
            }

            writer.setCustomProperty('alight-predefined-link', true, element);

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
      const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
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
   * Watches the DocumentSelection attribute changes and removes link decorator attributes when the alightPredefinedLinkPluginHref attribute is removed.
   *
   * This is to ensure that there is no left-over link decorator attributes on the document selection that is no longer in a link.
   */
  private _enableSelectionAttributesFixer(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    this.listenTo<DocumentSelectionChangeAttributeEvent>(selection, 'change:attribute', (evt, { attributeKeys }) => {
      if (!attributeKeys.includes('alightPredefinedLinkPluginHref') || selection.hasAttribute('alightPredefinedLinkPluginHref')) {
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
          if (item.hasAttribute('alightPredefinedLinkPluginHref')) {
            const newLink = addLinkProtocolIfApplicable(item.getAttribute('alightPredefinedLinkPluginHref') as string, defaultProtocol);

            writer.setAttribute('alightPredefinedLinkPluginHref', newLink, item);
          }
        }
      });
    });
  }
}

/**
 * Make the selection free of link-related model attributes.
 * All link-related model attributes start with "link". That includes not only "alightPredefinedLinkPluginHref"
 * but also all decorator attributes (they have dynamic names), or even custom plugins.
 */
function removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
  writer.removeSelectionAttribute('alightPredefinedLinkPluginHref');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginLinkName');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginFormat');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginAttributeValue');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginDestination');

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

/**
 * Helper function to check if a URL is a predefined link
 */
function isPredefinedLink(url: string | null | undefined): boolean {
  // If the URL is empty, null, or undefined, it's not a predefined link
  if (!url) return false;

  return true;
}
