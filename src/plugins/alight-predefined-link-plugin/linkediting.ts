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
import { keyCodes, env } from '@ckeditor/ckeditor5-utils';

import AlightPredefinedLinkPluginCommand from './linkcommand';
import AlightPredefinedLinkPluginUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  getLocalizedDecorators,
  normalizeDecorators,
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

/**
 * The link engine feature.
 */
export default class AlightPredefinedLinkPluginEditing extends Plugin {
  /**
   * Cache for link attributes to avoid repeated computation
   */
  private _linkAttributesCache: Array<string> | null = null;

  /**
   * Track processed elements to prevent double-processing
   */
  private _processedElements = new WeakSet();

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
    return [TwoStepCaretMovement, Input] as const;
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

    // Allow link attributes on all inline nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: [
        'alightPredefinedLinkPluginHref',
        'alightPredefinedLinkPluginLinkName',
        'alightPredefinedLinkPluginFormat'
      ]
    });

    // Setup conversion system
    this._setupConversions();

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

    // Check for conflicts with other link plugins
    this._checkForConflicts();
  }

  /**
   * Setup all conversion logic
   */
  private _setupConversions(): void {
    const editor = this.editor;

    // Setup data downcast (model to HTML output)
    this._setupDataDowncast();

    // Setup editing downcast (model to editing view)
    this._setupEditingDowncast();

    // Setup upcast (HTML input to model)
    this._setupUpcast();
  }

  /**
   * Setup data downcast with better attribute handling
   */
  private _setupDataDowncast(): void {
    const editor = this.editor;

    // Single comprehensive downcast converter
    editor.conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        if (!conversionApi.consumable.test(data.item, 'attribute:alightPredefinedLinkPluginHref')) {
          return;
        }

        const { writer, mapper } = conversionApi;
        const href = data.attributeNewValue;
        const linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName');
        const format = data.item.getAttribute('alightPredefinedLinkPluginFormat');

        if (!href || (!data.item.is('$textProxy') && !data.item.is('$text'))) {
          return;
        }

        try {
          // Create ah:link structure for predefined links
          if (format === 'ahcustom' && linkName) {
            const viewRange = mapper.toViewRange(data.range);
            const textContent = this._extractTextFromViewRange(viewRange);

            // Create the complete structure
            const linkElement = writer.createContainerElement('a', {
              'href': '#',
              'class': 'AHCustomeLink'
            });

            const ahLinkElement = writer.createContainerElement('ah:link', {
              'name': linkName
            });

            writer.insert(writer.createPositionAt(ahLinkElement, 0), writer.createText(textContent));
            writer.insert(writer.createPositionAt(linkElement, 0), ahLinkElement);

            // Replace the original range
            writer.insert(viewRange.start, linkElement);
            writer.remove(viewRange);
          }
          // Handle regular links
          else {
            const viewRange = mapper.toViewRange(data.range);
            const linkElement = writer.createAttributeElement('a', {
              'href': href
            });

            writer.wrap(viewRange, linkElement);
          }

          conversionApi.consumable.consume(data.item, 'attribute:alightPredefinedLinkPluginHref');

        } catch (error) {
          console.error('Error in data downcast:', error);
        }
      }, { priority: 'high' });
    });
  }

  /**
   * Setup editing downcast conversion (for editor view)
   */
  private _setupEditingDowncast(): void {
    const editor = this.editor;

    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (href, { writer }) => {
        if (!href) return null;

        const linkElement = writer.createAttributeElement('a', {
          'href': href,
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        }, {
          priority: 5,
          id: 'predefined-link'
        });

        writer.setCustomProperty('alight-predefined-link', true, linkElement);
        return linkElement;
      },
      converterPriority: 'high'
    });
  }

  /**
   * Setup upcast conversion with better conflict resolution
   */
  private _setupUpcast(): void {
    const editor = this.editor;

    // Single comprehensive upcast converter with highest priority
    editor.conversion.for('upcast').add(dispatcher => {
      dispatcher.on('element:a', (evt, data, conversionApi) => {
        const viewElement = data.viewItem;
        const { consumable, writer } = conversionApi;

        // Skip if already processed or consumed
        if (this._processedElements.has(viewElement) ||
          !consumable.test(viewElement, { name: true })) {
          return;
        }

        // Mark as processed immediately
        this._processedElements.add(viewElement);

        const hasAHCustomeClass = viewElement.hasClass('AHCustomeLink');
        const ahLinkElement = this._findAhLinkElement(viewElement);
        const href = viewElement.getAttribute('href');

        let processedSuccessfully = false;

        // Priority 1: Handle predefined links with ah:link structure
        if (hasAHCustomeClass && ahLinkElement?.is('element')) {
          processedSuccessfully = this._processPredefinedLinkWithAhLink(
            viewElement, ahLinkElement, data, writer, consumable
          );
        }
        // Priority 2: Handle regular links with valid href
        else if (href && href !== '#') {
          processedSuccessfully = this._processRegularLink(
            viewElement, href, data, writer, consumable
          );
        }

        // Only consume if we successfully processed
        if (processedSuccessfully) {
          consumable.consume(viewElement, { name: true });
          if (hasAHCustomeClass) {
            consumable.consume(viewElement, { classes: 'AHCustomeLink' });
          }
        }

      }, { priority: 'highest' });
    });
  }

  /**
   * Process predefined links with ah:link structure
   */
  private _processPredefinedLinkWithAhLink(
    viewElement: any,
    ahLinkElement: any,
    data: any,
    writer: any,
    consumable: any
  ): boolean {
    try {
      const linkName = ahLinkElement.getAttribute('name');

      if (!linkName) {
        return false;
      }

      const textContent = this._getTextFromElement(ahLinkElement) || linkName;

      // Create text node with predefined link attributes
      const textNode = writer.createText(textContent, {
        alightPredefinedLinkPluginHref: linkName,
        alightPredefinedLinkPluginFormat: 'ahcustom',
        alightPredefinedLinkPluginLinkName: linkName
      });

      writer.insert(textNode, data.modelCursor);

      data.modelRange = writer.createRange(
        data.modelCursor,
        data.modelCursor.getShiftedBy(textContent.length)
      );
      data.modelCursor = data.modelRange.end;

      // Consume ah:link element
      consumable.consume(ahLinkElement, { name: true });

      return true;
    } catch (error) {
      console.error('Error processing predefined link with ah:link:', error);
      return false;
    }
  }

  /**
   * Process regular links
   */
  private _processRegularLink(
    viewElement: any,
    href: string,
    data: any,
    writer: any,
    consumable: any
  ): boolean {
    try {
      const textContent = this._getTextFromElement(viewElement) || href;
      const hasAHCustomeClass = viewElement.hasClass('AHCustomeLink');
      const dataLinkName = viewElement.getAttribute('data-link-name');

      const attributes: Record<string, any> = {
        alightPredefinedLinkPluginHref: href
      };

      // Add predefined link attributes if indicators are present
      if (hasAHCustomeClass || dataLinkName) {
        attributes.alightPredefinedLinkPluginFormat = 'ahcustom';
        attributes.alightPredefinedLinkPluginLinkName = dataLinkName || href;
      }

      const textNode = writer.createText(textContent, attributes);
      writer.insert(textNode, data.modelCursor);

      data.modelRange = writer.createRange(
        data.modelCursor,
        data.modelCursor.getShiftedBy(textContent.length)
      );
      data.modelCursor = data.modelRange.end;

      return true;
    } catch (error) {
      console.error('Error processing regular link:', error);
      return false;
    }
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
   * Get text content from a view element
   */
  private _getTextFromElement(element: ViewElement): string {
    let text = '';

    for (const child of element.getChildren()) {
      if (child.is && child.is('$text')) {
        text += (child as any).data;
      } else if (child.is && child.is('element')) {
        text += this._getTextFromElement(child as ViewElement);
      }
    }

    return text;
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
   * Check for conflicts with other link plugins
   */
  private _checkForConflicts(): void {
    const editor = this.editor;

    if (editor.plugins.has('Link')) {
      console.warn('Standard Link plugin detected - may conflict with AlightPredefinedLinkPlugin');
    }

    if (editor.plugins.has('LinkEditing')) {
      console.warn('LinkEditing plugin detected - may conflict with AlightPredefinedLinkPlugin');
    }
  }

  /**
   * Get cached link attributes to avoid repeated computation
   */
  private _getLinkAttributesAllowedOnText(schema: Schema): Array<string> {
    if (this._linkAttributesCache === null) {
      const textAttributes = schema.getDefinition('$text')!.allowAttributes;
      this._linkAttributesCache = textAttributes.filter(attribute =>
        attribute.startsWith('link') || attribute.startsWith('alightPredefinedLinkPlugin')
      );
    }
    return this._linkAttributesCache;
  }

  /**
   * Processes an array of configured automatic decorators
   * and registers a downcast dispatcher for each one of them.
   */
  private _enableAutomaticDecorators(automaticDecoratorDefinitions: Array<NormalizedLinkDecoratorAutomaticDefinition>): void {
    const editor = this.editor;
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

  /**
   * Clean up resources when plugin is destroyed
   */
  public override destroy(): void {
    this._processedElements = new WeakSet();
    super.destroy();
  }
}
