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

      // Create link element as attribute element - this is important for proper rendering
      const linkElement = conversionApi.writer.createAttributeElement('a', {
        'href': '#',
        'class': 'AHCustomeLink',
        'data-id': 'predefined_link'
      }, {
        priority: 5
      });

      // Create the inner ah:link element with higher priority
      const ahLinkElement = conversionApi.writer.createAttributeElement('ah:link', {
        'name': linkName
      }, {
        priority: 6
      });

      // Set custom property for identification
      conversionApi.writer.setCustomProperty('alight-predefined-link', true, linkElement);

      // Return nested structure - we'll use the wrap method to apply this
      return {
        linkElement,
        ahLinkElement
      };
    };

    // For data downcast to produce <a class="AHCustomeLink" data-id="predefined_link"><ah:link>text</ah:link></a>
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (attributeValue, conversionApi) => {
        const { linkElement } = createDowncastConverter(attributeValue, conversionApi);
        return linkElement;
      }
    });

    // For editing view to produce the same structure
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (attributeValue, conversionApi) => {
        const { linkElement } = createDowncastConverter(attributeValue, conversionApi);
        return linkElement;
      }
    });

    // Handle the wrapping of text content with the ah:link element
    editor.conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if already consumed
        if (!conversionApi.consumable.consume(data.item, evt.name)) {
          return;
        }

        // Process attributes
        const linkName = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginLinkName') ?
          data.item.getAttribute('alightPredefinedLinkPluginLinkName') : '';
        const href = data.attributeNewValue || '';

        // Create the outer anchor element with LOWER priority
        const linkElement = conversionApi.writer.createAttributeElement('a', {
          'href': '#',
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        }, {
          priority: 5,
          id: 'link-wrapper'
        });

        // Create the inner ah:link element with HIGHER priority
        const ahLinkElement = conversionApi.writer.createAttributeElement('ah:link', {
          'name': linkName || extractPredefinedLinkId(href) || href
        }, {
          priority: 6
        });

        // Set custom property on the link element
        conversionApi.writer.setCustomProperty('alight-predefined-link', true, linkElement);

        if (data.item.is('selection')) {
          // For selection, get range
          const viewSelection = conversionApi.writer.document.selection;
          const range = viewSelection.getFirstRange();

          if (range) {
            // Apply in reverse order - inner element first with higher priority
            const ahLinkRange = conversionApi.writer.wrap(range, ahLinkElement);

            // Then the outer element with lower priority
            conversionApi.writer.wrap(ahLinkRange, linkElement);
          }
        } else {
          // For model element, get corresponding view range
          const viewRange = conversionApi.mapper.toViewRange(data.range);

          // Apply in reverse order - inner element first with higher priority
          const ahLinkRange = conversionApi.writer.wrap(viewRange, ahLinkElement);

          // Then the outer element with lower priority
          conversionApi.writer.wrap(ahLinkRange, linkElement);
        }
      }, { priority: 'high' });
    });

    // ======= UPDATED UPCAST CONVERTERS =======

    // Handle upcast from view to model for AHCustomeLink format
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: 'AHCustomeLink',
          attributes: {
            'href': '#'
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Look for the next sibling which should be the detailed link element
            const parent = viewElement.parent;
            if (!parent) return '';

            const elementIndex = parent.getChildIndex(viewElement);
            const nextSibling = parent.getChild(elementIndex + 1);

            if (nextSibling && nextSibling.is('element', 'a') && nextSibling.hasAttribute('onclick')) {
              const onclick = nextSibling.getAttribute('onclick') as string;

              // Extract link ID from onclick attribute using regex
              const linkIdMatch = onclick.match(/LinkId:([A-Z_0-9]+)/i);
              if (linkIdMatch && linkIdMatch[1]) {
                return linkIdMatch[1];
              }

              // If no link ID found, try to extract from href
              if (nextSibling.hasAttribute('href')) {
                const href = nextSibling.getAttribute('href') as string;
                const linkIdParam = href.match(/[?&]linkId=([^&]+)/i);
                if (linkIdParam && linkIdParam[1]) {
                  return linkIdParam[1];
                }
              }
            }

            // Check if there's an ah:link child element
            for (const child of viewElement.getChildren()) {
              if (child.is('element', 'ah:link') && child.hasAttribute('name')) {
                return child.getAttribute('name');
              }
            }

            // Fallback to empty string
            return '';
          }
        },
        converterPriority: 'highest'
      });

    // Handle onclick link format directly
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          attributes: {
            'onclick': /LinkId:[A-Z_0-9]+/i
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            const onclick = viewElement.getAttribute('onclick') as string;

            // Extract link ID from onclick attribute
            const linkIdMatch = onclick.match(/LinkId:([A-Z_0-9]+)/i);
            if (linkIdMatch && linkIdMatch[1]) {
              // Store additional information for the link format
              this.editor.model.once('_afterConversion', () => {
                this.editor.model.change(writer => {
                  const selection = this.editor.model.document.selection;
                  const range = selection.getFirstRange();

                  if (range) {
                    writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                    writer.setAttribute('alightPredefinedLinkPluginLinkName', linkIdMatch[1], range);
                  }
                });
              });

              return linkIdMatch[1];
            }

            // If no link ID found in onclick, try to extract from href as fallback
            if (viewElement.hasAttribute('href')) {
              const href = viewElement.getAttribute('href') as string;
              const linkIdParam = href.match(/[?&]linkId=([^&]+)/i);
              if (linkIdParam && linkIdParam[1]) {
                return linkIdParam[1];
              }
            }

            // Return the href if it exists, otherwise return an empty string
            return viewElement.hasAttribute('href') ? viewElement.getAttribute('href') : '';
          }
        },
        converterPriority: 'high'
      });

    // Handle legacy link formats as well
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
          value: (viewElement: ViewElement) => {
            // First check if it's a predefined link with data-id attribute
            const dataId = viewElement.getAttribute('data-id');

            // Always add target="_blank" for links during upcast
            viewElement._setAttribute('target', '_blank');

            // If it has predefined link attributes, use the link name as href
            if (dataId === 'predefined_link') {
              // Get link data from attributes
              const dataLinkName = viewElement.getAttribute('data-link-name');
              const href = viewElement.getAttribute('href');

              // If it has predefined link attributes, use the link name as href
              return dataLinkName || href;
            }

            // Otherwise get the actual href
            const href = viewElement.getAttribute('href');

            // If it's empty or just #, and not a predefined link, don't create a link
            if ((href === '' || href === '#') && !viewElement.hasClass('AHCustomeLink')) {
              return false; // This will prevent the attribute from being set
            }

            return href;
          }
        },
        converterPriority: 'low'
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
