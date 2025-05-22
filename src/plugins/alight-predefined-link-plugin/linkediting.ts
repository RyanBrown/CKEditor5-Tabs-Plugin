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
  ViewText
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
   * Cache for link attributes to avoid repeated computation
   */
  private _linkAttributesCache: Array<string> | null = null;

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

        console.log(`PDLEditor.dataDowncast.dispatcher.on -> alightPredefinedLinkPluginLinkName: ${data.item.getAttribute('alightPredefinedLinkPluginLinkName')}, data: `, data);
        console.log(`PDLEditor.dataDowncast.dispatcher.on -> alightPredefinedLinkPluginHref: ${data.item.getAttribute('alightPredefinedLinkPluginHref')}, data: `, data);
        const linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName');
        const viewRange = mapper.toViewRange(data.range);

        // Get text content using walker for better performance
        const textContent = this._extractTextFromViewRange(viewRange);

        // Only create predefined link structure if linkName exists
        if (linkName) {
          // Create the link with the exact structure we want
          const linkElement = writer.createContainerElement('a', {
            'href': '#',
            'class': 'AHCustomeLink'
          });

          const ahLinkElement = writer.createContainerElement('ah:link', {
            'name': linkName
          });

          // Add text content to ah:link
          writer.insert(writer.createPositionAt(ahLinkElement, 0), writer.createText(textContent));

          // Insert ah:link into a
          writer.insert(writer.createPositionAt(linkElement, 0), ahLinkElement);

          // Add to document and remove original
          writer.insert(viewRange.start, linkElement);
          writer.remove(viewRange);
        }
      });
    });

    // Simplified editing downcast for interactive editing view
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (href, { writer }) => {
        // Create a simple link element with the required attributes
        const linkElement = writer.createAttributeElement('a', {
          'href': href,
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        }, {
          priority: 5,
          id: 'predefined-link'
        });
        console.log(`PDLEditor.editingDowncast -> 8 href: ${href}, setting alight-predefined-link property to linkElement: `, linkElement);
        // Set custom property for link identification
        writer.setCustomProperty('alight-predefined-link', true, linkElement);

        return linkElement;
      }
    });

    // Handle specific format for predefined links with ah:link element
    // Handle all links in a single upcast conversion
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            'href': true
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement): string | boolean => {
            // First check if it has AHCustomeLink class
            const hasAHCustomeLink = viewElement.hasClass('AHCustomeLink');

            // Find ah:link element without creating intermediate array
            const ahLinkElement = this._findAhLinkElement(viewElement);

            if (hasAHCustomeLink && ahLinkElement?.is('element')) {
              // Get the name attribute from ah:link - this is the predefinedLinkName
              const predefinedLinkName = ahLinkElement.getAttribute('name');
              console.log(`PDLEditor.upcast -> hasAHCustomelink: true, ahLinkElement.is('element'): true, linkName: ${predefinedLinkName}`);
              // Only process if we have a valid predefinedLinkName
              if (predefinedLinkName) {
                // Store additional attributes for the predefined link
                this.editor.model.enqueueChange(writer => {
                  // Always set format to 'ahcustom'
                  writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');

                  // MOST IMPORTANTLY: Set the linkName attribute to predefinedLinkName
                  writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', predefinedLinkName);
                  writer.setSelectionAttribute('alightPredefinedLinkPluginHref', predefinedLinkName);
                });

                // Use the predefinedLinkName as the href value
                return predefinedLinkName;
              }
            }

            // Fallback to data-link-name attribute if no ah:link
            const dataLinkName = viewElement.getAttribute('data-link-name');
            if (dataLinkName) {
              // Set relevant attributes
              this.editor.model.enqueueChange(writer => {
                writer.setSelectionAttribute('alightPredefinedLinkPluginFormat', 'ahcustom');
                writer.setSelectionAttribute('alightPredefinedLinkPluginLinkName', dataLinkName);
                writer.setSelectionAttribute('alightPredefinedLinkPluginHref', dataLinkName);
              });
              return dataLinkName;
            }

            // For regular links, just get the href value
            const href = viewElement.getAttribute('href');

            // If it's empty or just #, and not a predefined link, don't create a link
            if ((href === '' || href === '#') && !hasAHCustomeLink) {
              return false; // This will prevent the attribute from being set
            }
            return href;
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

    // Clears the DocumentSelection decorator attributes if the selection is no longer in a link
    this._enableSelectionAttributesFixer();
  }

  /**
   * Extract text content from view range using walker
   */
  private _extractTextFromViewRange(viewRange: any): string {
    const walker = viewRange.getWalker({ shallow: true });
    const textParts: string[] = [];

    for (const { item } of walker) {
      if (item.is('$text') || item.is('$textProxy')) {
        textParts.push(item.data);
      }
    }

    return textParts.join('');
  }

  /**
   * Find ah:link element without creating intermediate array
   */
  private _findAhLinkElement(viewElement: ViewElement): ViewElement | null {
    for (const child of viewElement.getChildren()) {
      if (child.is && typeof child.is === 'function' && child.is('element', 'ah:link')) {
        return child as ViewElement;
      }
    }
    return null;
  }

  /**
   * Get cached link attributes to avoid repeated computation
   */
  private _getLinkAttributesAllowedOnText(schema: Schema): Array<string> {
    if (this._linkAttributesCache === null) {
      const textAttributes = schema.getDefinition('$text')!.allowAttributes;
      this._linkAttributesCache = textAttributes.filter(attribute => attribute.startsWith('link'));
    }
    return this._linkAttributesCache;
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
        this._removeLinkAttributesFromSelection(writer, this._getLinkAttributesAllowedOnText(model.schema));
      });
    });
  }

  /**
   * Make the selection free of link-related model attributes with batched operations.
   */
  private _removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
    // Batch all attribute removals
    const attributesToRemove = [
      'alightPredefinedLinkPluginHref',
      'alightPredefinedLinkPluginLinkName',
      'alightPredefinedLinkPluginFormat',
      ...linkAttributes
    ];

    // Remove all attributes in sequence for better performance
    attributesToRemove.forEach(attr => writer.removeSelectionAttribute(attr));
  }
}
