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

    // Additional attributes for storing predefined link data
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginDescription' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginBaseOrClientSpecific' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginPageType' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginDestination' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginPageCode' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginDomain' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginUniqueId' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginAttributeName' });
    editor.model.schema.extend('$text', { allowAttributes: 'alightPredefinedLinkPluginAttributeValue' });

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

      // Set custom property for identification
      conversionApi.writer.setCustomProperty('alight-predefined-link', true, linkElement);

      // Return nested structure - we'll use the wrap method to apply this
      return {
        linkElement,
        linkName
      };
    };

    // For data downcast to produce <a class="AHCustomeLink"></a> <ah:link>text</ah:link>
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

    // Handle the creation of the ah:link element
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
        const linkId = linkName || extractPredefinedLinkId(href) || href;

        // Collect additional link data attributes
        const linkDescription = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginDescription') ?
          data.item.getAttribute('alightPredefinedLinkPluginDescription') : '';
        const baseOrClientSpecific = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginBaseOrClientSpecific') ?
          data.item.getAttribute('alightPredefinedLinkPluginBaseOrClientSpecific') : '';
        const pageType = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginPageType') ?
          data.item.getAttribute('alightPredefinedLinkPluginPageType') : '';
        const destination = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginDestination') ?
          data.item.getAttribute('alightPredefinedLinkPluginDestination') : href;
        const pageCode = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginPageCode') ?
          data.item.getAttribute('alightPredefinedLinkPluginPageCode') : '';
        const domain = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginDomain') ?
          data.item.getAttribute('alightPredefinedLinkPluginDomain') : '';
        const uniqueId = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginUniqueId') ?
          data.item.getAttribute('alightPredefinedLinkPluginUniqueId') : '';
        const attributeName = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginAttributeName') ?
          data.item.getAttribute('alightPredefinedLinkPluginAttributeName') : '';
        const attributeValue = data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginAttributeValue') ?
          data.item.getAttribute('alightPredefinedLinkPluginAttributeValue') : '';

        // Create the outer anchor element with LOWER priority
        const linkElement = conversionApi.writer.createAttributeElement('a', {
          'href': '#',
          'class': 'AHCustomeLink',
          'data-id': 'predefined_link'
        }, {
          priority: 5,
          id: 'link-wrapper'
        });

        // Collect all custom attributes (those with prefix alightPredefinedLinkPluginCustom_)
        const customAttributes: Record<string, string> = {};
        if (data.item.getAttributes) {
          // Iterate through all attributes
          for (const [key, value] of data.item.getAttributes()) {
            // Check if this is a custom attribute
            if (typeof key === 'string' && key.startsWith('alightPredefinedLinkPluginCustom_')) {
              // Extract the original attribute name (remove the prefix)
              const originalAttrName = key.replace('alightPredefinedLinkPluginCustom_', '');
              customAttributes[originalAttrName] = value as string;
            }
          }
        }

        // Create the ah:link element that will be placed AFTER the <a> element
        // Add all required data attributes
        const ahLinkAttributes: Record<string, string> = {
          'name': linkId,
          'href': href,
          'data-id': 'predefined_link',
          'data-predefinedLinkName': linkName || '',
          'data-predefinedLinkDescription': linkDescription || '',
          'data-baseOrClientSpecific': baseOrClientSpecific || '',
          'data-pageType': pageType || '',
          'data-destination': destination || href,
          'data-pageCode': pageCode || '',
          'data-domain': domain || '',
          'data-uniqueId': uniqueId || '',
          'data-attributeName': attributeName || '',
          'data-attributeValue': attributeValue || ''
        };

        // Add custom attributes to the ahLinkAttributes object
        for (const [key, value] of Object.entries(customAttributes)) {
          ahLinkAttributes[key] = value;
        }

        const ahLinkElement = conversionApi.writer.createAttributeElement('ah:link', ahLinkAttributes, {
          priority: 6
        });

        // Set custom property on the link element
        conversionApi.writer.setCustomProperty('alight-predefined-link', true, linkElement);
        conversionApi.writer.setCustomProperty('alight-predefined-link-ah', true, ahLinkElement);

        if (data.item.is('selection')) {
          // For selection, get range
          const viewSelection = conversionApi.writer.document.selection;
          const range = viewSelection.getFirstRange();

          if (range) {
            // Apply in sequence: first <a>, then <ah:link> after it
            const linkRange = conversionApi.writer.wrap(range, linkElement);

            // This would place the ah:link after the a element in the DOM
            // However, we need to wrap the same content with the ah:link
            // So we need to get the range again and wrap it with the ah:link
            const rangeForAhLink = viewSelection.getFirstRange();
            if (rangeForAhLink) {
              conversionApi.writer.wrap(rangeForAhLink, ahLinkElement);
            }
          }
        } else {
          // For model element, get corresponding view range
          const viewRange = conversionApi.mapper.toViewRange(data.range);

          // Apply in sequence: first <a>, then <ah:link>
          const linkRange = conversionApi.writer.wrap(viewRange, linkElement);

          // Create a separate range for the ah:link element spanning the same content
          const ahLinkRange = conversionApi.mapper.toViewRange(data.range);
          conversionApi.writer.wrap(ahLinkRange, ahLinkElement);
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
            'href': true
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Look for the next sibling which should be the ah:link element
            const parent = viewElement.parent;
            if (!parent) return '';

            const elementIndex = parent.getChildIndex(viewElement);
            const nextSibling = parent.getChild(elementIndex + 1);

            if (nextSibling && nextSibling.is('element', 'ah:link')) {
              // Extract link ID from onclick attribute in ah:link
              if (nextSibling.hasAttribute('onclick')) {
                const onclick = nextSibling.getAttribute('onclick') as string;
                const linkIdMatch = onclick.match(/([A-Z_0-9]+)/i);
                if (linkIdMatch && linkIdMatch[1]) {
                  return linkIdMatch[1];
                }
              }

              // If no link ID found in onclick, try href attribute from ah:link
              if (nextSibling.hasAttribute('href')) {
                return nextSibling.getAttribute('href');
              }
            }

            // Fallback to empty string
            return '';
          }
        },
        converterPriority: 'highest'
      });

    // UPDATED: Handle ah:link element directly with improved attribute handling
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'ah:link'
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Extract link ID from various possible sources
            let linkId = '';

            // Try onclick attribute first
            if (viewElement.hasAttribute('onclick')) {
              const onclick = viewElement.getAttribute('onclick') as string;
              const linkIdMatch = onclick.match(/([A-Z_0-9]+)/i);
              if (linkIdMatch && linkIdMatch[1]) {
                linkId = linkIdMatch[1];
              }
            }

            // If no onclick, try name attribute
            if (!linkId && viewElement.hasAttribute('name')) {
              linkId = viewElement.getAttribute('name') as string;
            }

            // If still no ID, try href
            const href = viewElement.hasAttribute('href') ?
              viewElement.getAttribute('href') as string : '';

            if (!linkId && href) {
              linkId = extractPredefinedLinkId(href) || href;
            }

            // ENHANCED: Collect all attributes and store them for post-conversion processing
            // Process standard data attributes with specific naming pattern
            const attributesToStore: Record<string, string> = {};
            const customAttributes: Record<string, string> = {};

            // Get attributes from the element using getAttributes instead of getAttributeNames
            const attributes = viewElement.getAttributes();
            for (const [attrName, attrValue] of attributes) {
              // If it starts with 'data-' prefix and is a predefined attribute we care about
              if (typeof attrName === 'string') {
                if (attrName.startsWith('data-')) {
                  attributesToStore[attrName] = attrValue as string;
                } else if (['name', 'href', 'onclick'].includes(attrName)) {
                  // Store important non-data attributes too
                  attributesToStore[attrName] = attrValue as string;
                } else if (!['class', 'style', 'id'].includes(attrName)) {
                  // Store any other custom attributes
                  customAttributes[attrName] = attrValue as string;
                }
              }
            }

            // Get all data attributes directly for storage
            const predefinedLinkName = viewElement.hasAttribute('data-predefinedLinkName') ?
              viewElement.getAttribute('data-predefinedLinkName') as string :
              (viewElement.hasAttribute('name') ? viewElement.getAttribute('name') as string : '');

            const predefinedLinkDescription = viewElement.hasAttribute('data-predefinedLinkDescription') ?
              viewElement.getAttribute('data-predefinedLinkDescription') as string : '';

            const baseOrClientSpecific = viewElement.hasAttribute('data-baseOrClientSpecific') ?
              viewElement.getAttribute('data-baseOrClientSpecific') as string : '';

            const pageType = viewElement.hasAttribute('data-pageType') ?
              viewElement.getAttribute('data-pageType') as string : '';

            const destination = viewElement.hasAttribute('data-destination') ?
              viewElement.getAttribute('data-destination') as string : href;

            const pageCode = viewElement.hasAttribute('data-pageCode') ?
              viewElement.getAttribute('data-pageCode') as string : '';

            const domain = viewElement.hasAttribute('data-domain') ?
              viewElement.getAttribute('data-domain') as string : '';

            const uniqueId = viewElement.hasAttribute('data-uniqueId') ?
              viewElement.getAttribute('data-uniqueId') as string : '';

            const attributeName = viewElement.hasAttribute('data-attributeName') ?
              viewElement.getAttribute('data-attributeName') as string : '';

            const attributeValue = viewElement.hasAttribute('data-attributeValue') ?
              viewElement.getAttribute('data-attributeValue') as string : '';

            // Store additional information for the link format
            this.editor.model.once('_afterConversion', () => {
              this.editor.model.change(writer => {
                const selection = this.editor.model.document.selection;
                const range = selection.getFirstRange();

                if (range) {
                  writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                  writer.setAttribute('alightPredefinedLinkPluginLinkName', predefinedLinkName || linkId, range);

                  // Set additional attributes
                  if (predefinedLinkDescription) {
                    writer.setAttribute('alightPredefinedLinkPluginDescription', predefinedLinkDescription, range);
                  }

                  if (baseOrClientSpecific) {
                    writer.setAttribute('alightPredefinedLinkPluginBaseOrClientSpecific', baseOrClientSpecific, range);
                  }

                  if (pageType) {
                    writer.setAttribute('alightPredefinedLinkPluginPageType', pageType, range);
                  }

                  if (destination) {
                    writer.setAttribute('alightPredefinedLinkPluginDestination', destination, range);
                  }

                  if (pageCode) {
                    writer.setAttribute('alightPredefinedLinkPluginPageCode', pageCode, range);
                  }

                  if (domain) {
                    writer.setAttribute('alightPredefinedLinkPluginDomain', domain, range);
                  }

                  if (uniqueId) {
                    writer.setAttribute('alightPredefinedLinkPluginUniqueId', uniqueId, range);
                  }

                  if (attributeName) {
                    writer.setAttribute('alightPredefinedLinkPluginAttributeName', attributeName, range);
                  }

                  if (attributeValue) {
                    writer.setAttribute('alightPredefinedLinkPluginAttributeValue', attributeValue, range);
                  }

                  // Store any additional custom attributes
                  for (const [key, value] of Object.entries(customAttributes)) {
                    // Create attribute name by prefixing with our plugin name to avoid collisions
                    const modelAttrName = `alightPredefinedLinkPluginCustom_${key}`;
                    // Extend schema for this custom attribute if it doesn't exist
                    if (!editor.model.schema.checkAttribute('$text', modelAttrName)) {
                      editor.model.schema.extend('$text', { allowAttributes: modelAttrName });
                    }
                    writer.setAttribute(modelAttrName, value, range);
                  }
                }
              });
            });

            return linkId || href;
          }
        },
        converterPriority: 'high'
      });

    // Handle legacy link formats as well
    // In linkediting.ts, modify the upcast conversion

    // Handle upcast from view to model for AHCustomeLink format with empty <a> tag
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: 'AHCustomeLink',
          attributes: {
            'href': true,
            // 'data-id': 'predefined_link'
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Look for the next sibling which should be the ah:link element
            const parent = viewElement.parent;
            if (!parent) return '';

            const elementIndex = parent.getChildIndex(viewElement);
            const nextSibling = parent.getChild(elementIndex + 1);

            if (nextSibling && nextSibling.is('element', 'ah:link')) {
              // Extract link ID from the ah:link element
              if (nextSibling.hasAttribute('name')) {
                return nextSibling.getAttribute('name');
              }

              // Fallback to href if name isn't available
              if (nextSibling.hasAttribute('href')) {
                return nextSibling.getAttribute('href');
              }
            }

            // Fallback to empty string
            return '';
          }
        },
        converterPriority: 'highest'
      });

    // UPDATED: Handle ah:link element with content
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'ah:link'
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Extract link ID from name attribute first
            if (viewElement.hasAttribute('name')) {
              return viewElement.getAttribute('name');
            }

            // If no name, try href
            if (viewElement.hasAttribute('href')) {
              return viewElement.getAttribute('href');
            }

            return '';
          }
        },
        converterPriority: 'high'
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

    if (command && command.automaticDecorators) {
      command.automaticDecorators.add(automaticDecoratorDefinitions);

      if (command.automaticDecorators.length) {
        editor.conversion.for('downcast').add(command.automaticDecorators.getDispatcher());
      }
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

    if (command && command.manualDecorators) {
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
  writer.removeSelectionAttribute('alightPredefinedLinkPluginDescription');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginBaseOrClientSpecific');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginPageType');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginDestination');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginPageCode');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginDomain');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginUniqueId');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginAttributeName');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginAttributeValue');

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
