// src/plugins/alight-predefined-link-plugin/linkediting.ts
import {
  Plugin,
  type Editor
} from '@ckeditor/ckeditor5-core';
import type {
  Schema,
  Writer,
  ViewElement,
  ViewText,
  ViewNode,
  Node,
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

    // Create a custom downcast converter for streamlined link structure
    editor.conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if not consumable
        if (!conversionApi.consumable.consume(data.item, evt.name)) {
          return;
        }

        const { writer, mapper } = conversionApi;
        const viewRange = mapper.toViewRange(data.range);

        // Get href and linkName
        const href = data.attributeNewValue as string || '';
        let linkName = '';

        // Try to get link name from attributes
        if (data.item.is('$textProxy') && data.item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
          const attrValue = data.item.getAttribute('alightPredefinedLinkPluginLinkName');
          linkName = typeof attrValue === 'string' ? attrValue : '';
        } else if (data.item.is('selection') && data.item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
          const attrValue = data.item.getAttribute('alightPredefinedLinkPluginLinkName');
          linkName = typeof attrValue === 'string' ? attrValue : '';
        } else {
          const extracted = extractPredefinedLinkId(href);
          linkName = extracted || href;
        }

        if (data.attributeNewValue) {
          // Creating or updating a link
          try {
            // For links we should use AttributeElement which is designed for inline formatting
            const linkElement = writer.createAttributeElement('a', {
              'href': '#',
              'class': 'AHCustomeLink',
              'data-id': 'predefined_link'
            }, {
              // Higher priority to ensure proper nesting
              priority: 5
            });

            // Set custom property to identify this as our link
            writer.setCustomProperty('alight-predefined-link', true, linkElement);

            // Create the inner ah:link element as an attribute element too
            const ahLinkElement = writer.createAttributeElement('ah:link', {
              'name': linkName,
              'href': href,
              'data-id': 'predefined_link'
            }, {
              // Higher priority than the parent to ensure proper nesting
              priority: 6
            });

            // Set custom property for the inner element
            writer.setCustomProperty('alight-predefined-link-ah', true, ahLinkElement);

            // Apply elements to range - first inner element then outer
            writer.wrap(viewRange, ahLinkElement);
            writer.wrap(viewRange, linkElement);
          } catch (error) {
            console.error('Error creating link structure:', error);
          }
        } else {
          // Removing a link
          for (const node of viewRange.getItems()) {
            // Only process text nodes
            if (!node.is('$text')) {
              continue;
            }

            // Find the closest link ancestor
            const linkElement = findLinkElementAncestor(node);
            if (!linkElement) {
              continue;
            }

            // Find an ah:link element inside the link
            let ahLinkElement = null;
            for (const ancestor of node.getAncestors()) {
              if (ancestor.is('attributeElement', 'ah:link')) {
                ahLinkElement = ancestor;
                break;
              }
            }

            // Unwrap in the correct order (inner first, then outer)
            if (ahLinkElement) {
              writer.unwrap(writer.createRangeOn(node), ahLinkElement);
            }

            // Remove the outer link
            writer.unwrap(writer.createRangeOn(node), linkElement);
          }
        }
      });
    });

    // Handle upcast from <a> with nested <ah:link>
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        classes: 'AHCustomeLink'
      },
      model: {
        key: 'alightPredefinedLinkPluginHref',
        value: (viewElement: ViewElement) => {
          // Try to find nested ah:link element
          let linkName = '';
          let linkHref = '';

          // Check if there's a nested ah:link element
          const ahLinkElement = findFirstChildByName(viewElement, 'ah:link');

          if (ahLinkElement) {
            linkName = ahLinkElement.getAttribute('name') || '';
            linkHref = ahLinkElement.getAttribute('href') || '';
          } else {
            // Fallback to attributes from the outer a element
            linkName = viewElement.getAttribute('href') || '';
            linkHref = viewElement.getAttribute('href') || '';
          }

          // Store additional information
          this.editor.model.once('_afterConversion', () => {
            this.editor.model.change(writer => {
              const selection = this.editor.model.document.selection;
              const range = selection.getFirstRange();

              if (range) {
                writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
              }
            });
          });

          return linkHref || '';
        }
      },
      converterPriority: 'highest'
    });

    // Also handle direct <ah:link> elements during upcast
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'ah:link',
        attributes: {
          'name': true
        }
      },
      model: {
        key: 'alightPredefinedLinkPluginHref',
        value: (viewElement: ViewElement) => {
          // Extract the linkName from the name attribute
          const linkName = viewElement.getAttribute('name') || '';
          const linkHref = viewElement.getAttribute('href') || linkName;

          // Store additional information for the link
          this.editor.model.once('_afterConversion', () => {
            this.editor.model.change(writer => {
              const selection = this.editor.model.document.selection;
              const range = selection.getFirstRange();

              if (range) {
                writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
                writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
              }
            });
          });

          return linkHref;
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
      // We'll handle automatic decorators manually to make them compatible with our nested structure
      editor.conversion.for('downcast').add(dispatcher => {
        dispatcher.on('attribute:alightPredefinedLinkPluginHref:$text', (evt, data, conversionApi) => {
          // Skip if already consumed
          if (!conversionApi.consumable.test(data.item, 'attribute:alightPredefinedLinkPluginHref')) {
            return;
          }

          const href = data.attributeNewValue as string | null;

          // Process each automatic decorator
          for (const decorator of automaticDecoratorDefinitions) {
            if (href && decorator.callback(href)) {
              // Find all <a> elements in this range
              const viewRange = conversionApi.mapper.toViewRange(data.range);
              const viewWriter = conversionApi.writer;

              for (const item of Array.from(viewRange.getItems())) {
                if (!isViewNode(item) || !item.is('$text')) continue;

                const linkElement = findLinkAncestor(item);
                if (!linkElement) continue;

                // Apply the decorator attributes to the <a> element
                if (decorator.attributes) {
                  for (const [key, value] of Object.entries(decorator.attributes)) {
                    viewWriter.setAttribute(key, value, linkElement);
                  }
                }

                // Apply classes
                if (decorator.classes) {
                  const classes = Array.isArray(decorator.classes) ? decorator.classes : [decorator.classes];
                  for (const className of classes) {
                    viewWriter.addClass(className, linkElement);
                  }
                }

                // Apply styles
                if (decorator.styles) {
                  for (const [key, value] of Object.entries(decorator.styles)) {
                    viewWriter.setStyle(key, value, linkElement);
                  }
                }
              }
            }
          }
        });
      });
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

      // Handle manual decorators with custom downcast to make them compatible with our nested structure
      editor.conversion.for('downcast').add(dispatcher => {
        dispatcher.on(`attribute:${decorator.id}:$text`, (evt, data, conversionApi) => {
          // Skip if already consumed
          if (!conversionApi.consumable.consume(data.item, evt.name)) {
            return;
          }

          const viewRange = conversionApi.mapper.toViewRange(data.range);
          const viewWriter = conversionApi.writer;

          // Only apply if the value is true
          if (data.attributeNewValue) {
            // Find all <a> elements in this range
            for (const item of Array.from(viewRange.getItems())) {
              if (!isViewNode(item) || !item.is('$text')) continue;

              const linkElement = findLinkAncestor(item);
              if (!linkElement) continue;

              // Apply the decorator attributes to the <a> element
              if (decorator.attributes) {
                for (const [key, value] of Object.entries(decorator.attributes)) {
                  viewWriter.setAttribute(key, value, linkElement);
                }
              }

              // Apply classes
              if (decorator.classes) {
                const classes = Array.isArray(decorator.classes) ? decorator.classes : [decorator.classes];
                for (const className of classes) {
                  viewWriter.addClass(className, linkElement);
                }
              }

              // Apply styles
              if (decorator.styles) {
                for (const [key, value] of Object.entries(decorator.styles)) {
                  viewWriter.setStyle(key, value, linkElement);
                }
              }
            }
          } else {
            // Remove the decorator attributes when the value is false
            for (const item of Array.from(viewRange.getItems())) {
              if (!isViewNode(item) || !item.is('$text')) continue;

              const linkElement = findLinkAncestor(item);
              if (!linkElement) continue;

              // Remove the decorator attributes from the <a> element
              if (decorator.attributes) {
                for (const key of Object.keys(decorator.attributes)) {
                  viewWriter.removeAttribute(key, linkElement);
                }
              }

              // Remove classes
              if (decorator.classes) {
                const classes = Array.isArray(decorator.classes) ? decorator.classes : [decorator.classes];
                for (const className of classes) {
                  viewWriter.removeClass(className, linkElement);
                }
              }

              // Remove styles
              if (decorator.styles) {
                for (const key of Object.keys(decorator.styles)) {
                  viewWriter.removeStyle(key, linkElement);
                }
              }
            }
          }
        });
      });

      editor.conversion.for('upcast').elementToAttribute({
        view: {
          name: 'a',
          ...decorator._createPattern()
        },
        model: {
          key: decorator.id,
          value: true
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
 * Type guard to check if an unknown value is a ViewNode
 */
function isViewNode(node: unknown): node is ViewNode {
  return !!node && typeof node === 'object' && 'is' in node;
}

/**
 * Type guard to check if a ViewNode is a ViewText node
 */
function isViewText(node: unknown): node is ViewText {
  return isViewNode(node) && node.is('$text');
}

/**
 * Find an element ancestor that is an <a> with AHCustomeLink class
 */
function findLinkAncestor(node: ViewNode): ViewElement | null {
  if (!node.getAncestors) {
    return null;
  }

  for (const ancestor of node.getAncestors()) {
    if (ancestor.is('element', 'a') && hasClass(ancestor, 'AHCustomeLink')) {
      return ancestor as ViewElement;
    }
  }
  return null;
}

/**
 * Find the first child element of a specific name
 */
function findFirstChildByName(element: ViewElement, name: string): ViewElement | null {
  if (!element.getChildren) {
    return null;
  }

  for (const child of element.getChildren()) {
    if (child.is('element', name)) {
      return child as ViewElement;
    }
  }
  return null;
}

/**
 * Find an ah:link child element in a parent element
 */
function findAhLinkChild(element: ViewElement): ViewElement | null {
  return findFirstChildByName(element, 'ah:link');
}

/**
 * Check if an element has a specific class
 */
function hasClass(element: ViewElement, className: string): boolean {
  const classes = element.getAttribute('class');
  if (!classes) return false;

  if (typeof classes === 'string') {
    return classes.split(' ').includes(className);
  }

  return false;
}

/**
 * Find a link element ancestor from any element
 */
function findLinkElementAncestor(item: any): ViewElement | null {
  return item.getAncestors().find((ancestor: ViewElement) =>
    ancestor.is('element', 'a') &&
    ancestor.hasClass('AHCustomeLink')
  );
}
