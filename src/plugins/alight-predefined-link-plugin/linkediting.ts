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
  ViewDocumentFragment,
  ViewRange,
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
 * Returns `true` if a given view node is the link element.
 */
function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  return (
    node.is('attributeElement') && (
      !!node.getCustomProperty('alight-predefined-link') ||
      node.hasClass('AHCustomeLink') ||
      node.getAttribute('data-id') === 'predefined_link'
    )
  );
}

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

    // Setup data downcast conversion for links with a nested ah:link element
    // This is for the output HTML when saving the content
    editor.conversion.for('dataDowncast').add(dispatcher => {
      dispatcher.on('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if attribute already consumed
        if (!conversionApi.consumable.consume(data.item, evt.name)) {
          return;
        }

        const { writer, mapper } = conversionApi;

        const href = data.attributeNewValue;

        // If the attribute was removed
        if (!href) {
          return;
        }

        // Only proceed for text items
        if (!data.item.is('$textProxy') && !data.item.is('$text')) {
          return;
        }

        // Get position range for conversion
        const viewRange = mapper.toViewRange(data.range);

        // Get link name from model attribute or extract from href - KEY FIX HERE
        let linkName = '';

        // Try to get link name from the model attribute if available
        if (data.item && typeof data.item.getAttribute === 'function') {
          // PRIORITY 1: Use alightPredefinedLinkPluginLinkName attribute if it exists
          if (data.item.getAttribute('alightPredefinedLinkPluginLinkName')) {
            linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName') as string;
          }
          // PRIORITY 2: Extract from href if no linkName attribute
          else {
            linkName = extractPredefinedLinkId(href) || href;
          }
        } else {
          // Fall back to extracting from href
          linkName = extractPredefinedLinkId(href) || href;
        }

        // Create the outer link element as a ContainerElement
        const linkElement = writer.createContainerElement('a', {
          'href': '#',
          'class': 'AHCustomeLink'
        });

        // Create the inner ah:link element with the linkName (not the text content)
        const ahLinkElement = writer.createContainerElement('ah:link', {
          'name': linkName // Using linkName, not text content
        });

        // Get text content from the view range
        let textContent = '';
        for (const item of viewRange.getItems()) {
          if ((item as ViewNode).is && ((item as ViewNode).is('$text') || (item as ViewNode).is('$textProxy'))) {
            textContent += (item as ViewText).data;
          }
        }

        // Add the text to the ah:link element
        if (textContent) {
          writer.insert(writer.createPositionAt(ahLinkElement, 0), writer.createText(textContent));
        }

        // Insert the ah:link element into the link
        writer.insert(writer.createPositionAt(linkElement, 0), ahLinkElement);

        // Insert the link structure where the original text was
        writer.insert(viewRange.start, linkElement);

        // Remove the original text
        writer.remove(viewRange);
      });
    });

    // Setup editing downcast for interactive editing view - using custom downcast converter
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (href, { writer }) => {
        // For editing view, use attributeElement for proper behavior
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

    // Handle specific format for predefined links with ah:link element
    editor.conversion.for('upcast')
      .elementToAttribute({
        view: {
          name: 'a',
          classes: 'AHCustomeLink',
          attributes: {
            'data-id': 'predefined_link'
          }
        },
        model: {
          key: 'alightPredefinedLinkPluginHref',
          value: (viewElement: ViewElement) => {
            // Check for ah:link element inside
            const ahLinkElement = viewElement.getChild(0);

            if (ahLinkElement && ahLinkElement.is('element', 'ah:link')) {
              // Extract the name attribute from ah:link
              const linkName = ahLinkElement.getAttribute('name');

              // Store additional information about the link format
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

              // Return the link name as the href value
              return linkName || '';
            }

            // Fallback to the href attribute if no ah:link is found
            return viewElement.getAttribute('href') || '#';
          }
        },
        converterPriority: 'highest'
      });

    // Handle standard links - upcast conversion
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
            // First check if it has AHCustomeLink class
            const hasAHCustomeLink = viewElement.hasClass('AHCustomeLink');

            // If it has AHCustomeLink class but wasn't handled by the previous converter
            if (hasAHCustomeLink) {
              // Check for ah:link element inside as a fallback
              for (const child of viewElement.getChildren()) {
                if (child.is('element', 'ah:link')) {
                  const linkName = child.getAttribute('name');
                  return linkName || viewElement.getAttribute('href') || '#';
                }
              }

              // Get data-link-name attribute if no ah:link
              const dataLinkName = viewElement.getAttribute('data-link-name');
              return dataLinkName || viewElement.getAttribute('href') || '#';
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
   * Processes an array of configured automatic decorators
   * and registers a downcast dispatcher for each one of them.
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
   * Processes an array of configured manual decorators,
   * transforms them into ManualDecorator instances and stores them in the
   * LinkCommand's manualDecorators collection (a model for manual decorators state).
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
