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
  DocumentSelectionChangeAttributeEvent,
  ViewNode,
  ViewDocumentFragment
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
  getLocalizedDecorators,
  normalizeDecorators,
  addLinkProtocolIfApplicable,
  createBookmarkCallbacks,
  isPredefinedLink,
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

    // Register the ah:link element in the schema
    editor.model.schema.register('ahLink', {
      allowWhere: '$text',
      allowAttributes: ['name']
    });

    // Allow link attribute on all inline nodes.
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginHref' });

    // For storing additional link data
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginLinkName' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginFormat' });

    // Setup data downcast conversion for links with a nested ah:link element
    editor.conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if attribute already consumed
        if (!conversionApi.consumable.consume(data.item, evt.name)) {
          return;
        }

        const { writer, mapper } = conversionApi;
        const href = data.attributeNewValue;

        // If the attribute was removed or not a text item, return
        if (!href || (!data.item.is('$textProxy') && !data.item.is('$text'))) {
          return;
        }

        // Get position range for conversion
        const viewRange = mapper.toViewRange(data.range);

        // Get the link name - this is critical for predefined links
        const linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName');

        // Get text content from the view range
        let textContent = '';
        for (const item of viewRange.getItems()) {
          if ((item.is && (item.is('$text') || item.is('$textProxy')))) {
            textContent += item.data;
          }
        }

        // Always use a valid linkName - fallback chain for maximum robustness
        const finalLinkName = linkName || href || textContent || 'unnamed-link';

        // Create the link element with all required attributes
        // Always use these fixed attributes for predefined links
        const linkElement = writer.createContainerElement('a', {
          'href': '#',
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        });

        // Create the ah:link element with the name attribute
        const ahLinkElement = writer.createContainerElement('ah:link', {
          'name': finalLinkName
        });

        // Add text content to ah:link
        writer.insert(writer.createPositionAt(ahLinkElement, 0), writer.createText(textContent));

        // Insert ah:link into a
        writer.insert(writer.createPositionAt(linkElement, 0), ahLinkElement);

        // Add to document and remove original
        writer.insert(viewRange.start, linkElement);
        writer.remove(viewRange);
      });
    });

    // Simplified editing downcast for interactive editing view
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (href, { writer }) => {
        // Create a simple link element with the required attributes
        const linkElement = writer.createAttributeElement('a', {
          'href': '#',
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        }, {
          priority: 5,
          id: 'predefined-link'
        });

        // Set custom property for link identification
        writer.setCustomProperty('alight-predefined-link', true, linkElement);

        return linkElement;
      }
    });

    // Enhanced upcast conversion for predefined links - Fixed TypeScript errors
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: ['AHCustomeLink']
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement): string | boolean => {
            // Try to find ah:link element inside
            const ahLinkElement = Array.from(viewElement.getChildren())
              .find(child => {
                return child.is &&
                  typeof child.is === 'function' &&
                  // Fixed TypeScript error - properly check if it's an element before accessing name
                  (child.is('element') &&
                    (child.is('element', 'ah:link') ||
                      (child as ViewElement).name === 'ah:link'));
              });

            let predefinedLinkName = '';

            // First try to get name from ah:link element if it's an element
            if (ahLinkElement && ahLinkElement.is('element')) {
              predefinedLinkName = ahLinkElement.getAttribute('name') as string;
            }

            // If no ah:link or no name attribute, check for data-link-name
            if (!predefinedLinkName) {
              predefinedLinkName = viewElement.getAttribute('data-link-name') as string;
            }

            // Fixed TypeScript errors - safely extract text content
            if (!predefinedLinkName) {
              // Try to extract text content safely with type checking
              const textContent = Array.from(viewElement.getChildren()).reduce((text, child) => {
                // Check if this is a text node before accessing data
                if (child.is('$text')) {
                  return text + child.data;
                }
                // If it's an element, try to get its text content
                if (child.is('element')) {
                  const nestedTexts = Array.from(child.getChildren())
                    .filter(nestedChild => nestedChild.is('$text'))
                    .map(textNode => (textNode as any).data || '')
                    .join('');
                  return text + nestedTexts;
                }
                return text;
              }, '');

              predefinedLinkName = textContent || 'unnamed-link';
            }

            // Always set these attributes
            this.editor.model.enqueueChange(writer => {
              writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');
              writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', predefinedLinkName);
            });

            // Always return the predefinedLinkName as the href
            return predefinedLinkName;
          }
        },
        converterPriority: 'highest'
      });

    // Second upcast converter for backward compatibility
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            'data-id': 'predefined_link'
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement): string | boolean => {
            // Try to find ah:link element inside
            const ahLinkElement = Array.from(viewElement.getChildren())
              .find(child => {
                return child.is &&
                  typeof child.is === 'function' &&
                  child.is('element', 'ah:link');
              });

            if (ahLinkElement && ahLinkElement.is('element')) {
              // This is a predefined link with ah:link structure
              const predefinedLinkName = ahLinkElement.getAttribute('name');
              if (predefinedLinkName) {
                // Set attributes
                this.editor.model.enqueueChange(writer => {
                  writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');
                  writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', predefinedLinkName);
                });
                return predefinedLinkName;
              }
            }

            // Get data-link-name if available
            const dataLinkName = viewElement.getAttribute('data-link-name');
            if (dataLinkName) {
              this.editor.model.enqueueChange(writer => {
                writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');
                writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', dataLinkName);
              });
              return dataLinkName;
            }

            // If we get here and don't have a proper identifier, use the href or a fallback
            const href = viewElement.getAttribute('href');
            return href ? href as string : 'unnamed-link';
          }
        },
        converterPriority: 'low'  // Lower priority than main converter
      });

    // Add a third upcast converter for links with ah:link but no other predefined markers
    // This is for backward compatibility
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a'
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement): string | boolean => {
            // Skip if it already has our predefined markers
            if (viewElement.hasClass('AHCustomeLink') || viewElement.getAttribute('data-id') === 'predefined_link') {
              return false;
            }

            // Only process links that have ah:link children
            const ahLinkElement = Array.from(viewElement.getChildren())
              .find(child => {
                return child.is &&
                  typeof child.is === 'function' &&
                  child.is('element', 'ah:link');
              });

            if (ahLinkElement && ahLinkElement.is('element')) {
              // This is a legacy predefined link
              const predefinedLinkName = ahLinkElement.getAttribute('name');
              if (predefinedLinkName) {
                // Set attributes
                this.editor.model.enqueueChange(writer => {
                  writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');
                  writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', predefinedLinkName);
                });
                return predefinedLinkName;
              }
            }

            // Return false for links that don't meet predefined criteria
            // This means standard links won't be affected
            return false;
          }
        },
        converterPriority: 'lowest'
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

    // Clears the DocumentSelection decorator attributes if the selection is no longer in a link
    this._enableSelectionAttributesFixer();

    // Handle adding default protocol to pasted links.
    this._enableClipboardIntegration();
  }

  /**
   * Processes an array of configured automatic decorators
   * and registers a downcast dispatcher for each one of them.
   */
  private _enableAutomaticDecorators(automaticDecoratorDefinitions: Array<NormalizedLinkDecoratorAutomaticDefinition>): void {
    const editor = this.editor;
    // Store automatic decorators in the command instance
    const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    automaticDecorators.add(automaticDecoratorDefinitions);

    if (automaticDecorators.length) {
      editor.conversion.for('downcast').add(automaticDecorators.getDispatcher());
    }
  }

  /**
   * Processes an array of configured manual decorators,
   * transforms them into ManualDecorator instances and stores them in the
   * LinkCommand's manualDecorators collection.
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
        view: (manualDecoratorValue, { writer }) => {
          if (manualDecoratorValue) {
            // For editing view, use attributeElement
            const element = writer.createAttributeElement('a', decorator.attributes || {}, { priority: 5 });

            if (decorator.classes) {
              writer.addClass(decorator.classes, element);
            }

            for (const key in decorator.styles || {}) {
              writer.setStyle(key, decorator.styles[key], element);
            }

            writer.setCustomProperty('alight-predefined-link', true, element);

            return element;
          }

          return null;
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
