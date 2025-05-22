// src/plugins/alight-predefined-link-plugin/linkediting.ts
import {
  Plugin,
  type Editor
} from '@ckeditor/ckeditor5-core';
import type {
  Schema,
  Writer,
  ViewElement,
  Element as ModelElement
} from '@ckeditor/ckeditor5-engine';
import {
  Input,
  TwoStepCaretMovement,
  inlineHighlight
} from '@ckeditor/ckeditor5-typing';
import {
  ClipboardPipeline
} from '@ckeditor/ckeditor5-clipboard';

import AlightPredefinedLinkPluginCommand from './linkcommand';
import AlightPredefinedLinkPluginUnlinkCommand from './unlinkcommand';
import ManualDecorator from './utils/manualdecorator';
import {
  getLocalizedDecorators,
  normalizeDecorators,
  type NormalizedLinkDecoratorAutomaticDefinition,
  type NormalizedLinkDecoratorManualDefinition,
  isPredefinedLink
} from './utils';

import '@ckeditor/ckeditor5-link/theme/link.css';

const HIGHLIGHT_CLASS = 'ck-link_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';

/**
 * The link engine feature for Alight Predefined Link Plugin.
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

    // Register schema with both element and attribute approaches
    this._registerSchema(editor);

    // Setup conversions
    this._setupConversions(editor);

    // Create linking commands
    this._addLinkingCommands(editor);

    // Configure link decorators
    this._configureDecorators(editor);

    // Enable two-step caret movement
    this._enableTwoStepCaretMovement(editor);

    // Setup link highlight
    this._setupLinkHighlight(editor);
  }

  /**
   * Registers schema for attribute-based links (simplified approach)
   */
  private _registerSchema(editor: Editor): void {
    // Use attribute-based approach - much simpler and preserves text content
    editor.model.schema.extend('$text', {
      allowAttributes: [
        'alightPredefinedLinkPluginHref',
        'alightPredefinedLinkPluginLinkName',
        'alightPredefinedLinkPluginFormat'
      ]
    });
  }

  /**
   * Sets up conversions for the plugin
   */
  private _setupConversions(editor: Editor): void {
    // UPCAST CONVERSIONS (View -> Model)
    // 1. Handle AHCustomeLink wrapper - just convert to attributes, preserve text
    editor.conversion.for('upcast').elementToAttribute({
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
          // Extract href, defaulting to '#' for predefined links
          return viewElement.getAttribute('href') || '#';
        }
      }
    });

    // 2. Handle ah:link elements - extract the name attribute and convert to linkName attribute
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'ah:link'
      },
      model: {
        key: 'alightPredefinedLinkPluginLinkName',
        value: (viewElement: ViewElement) => {
          return viewElement.getAttribute('name') || '';
        }
      }
    });

    // 3. Handle spans with data-exp="ah:link" (editing view format)
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        attributes: {
          'data-exp': 'ah:link'
        }
      },
      model: {
        key: 'alightPredefinedLinkPluginLinkName',
        value: (viewElement: ViewElement) => {
          return viewElement.getAttribute('name') || '';
        }
      }
    });

    // 4. Handle standard href attribute (for backward compatibility)
    editor.conversion.for('upcast').attributeToAttribute({
      view: {
        name: 'a',
        key: 'href'
      },
      model: {
        key: 'alightPredefinedLinkPluginHref',
        value: (viewElement: ViewElement) => viewElement.getAttribute('href')
      }
    });

    // EDITING DOWNCAST CONVERSIONS (Model -> Editing View)
    // For editing, we just need the link wrapper - text content is preserved automatically
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (modelAttributeValue, conversionApi) => {
        if (!modelAttributeValue) {
          return null;
        }

        const isPredefined = isPredefinedLink(modelAttributeValue as string);

        if (isPredefined) {
          // For editing view, create predefined link wrapper
          return conversionApi.writer.createAttributeElement('a', {
            href: '#',
            class: 'AHCustomeLink',
            'data-id': 'predefined_link'
          }, {
            priority: 5,
            id: 'predefined-link'
          });
        } else {
          // Standard link for editing
          return conversionApi.writer.createAttributeElement('a', {
            href: modelAttributeValue as string
          }, {
            priority: 5,
            id: 'link'
          });
        }
      }
    });

    // DATA DOWNCAST CONVERSIONS (Model -> Data/Output)
    // For data output, we also just create the wrapper - post-processing handles the ah:link nesting
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightPredefinedLinkPluginHref',
      view: (modelAttributeValue, conversionApi) => {
        if (!modelAttributeValue) {
          return null;
        }

        const isPredefined = isPredefinedLink(modelAttributeValue as string);

        if (isPredefined) {
          // Create the outer link element for data output
          return conversionApi.writer.createAttributeElement('a', {
            href: '#',
            class: 'AHCustomeLink',
            'data-id': 'predefined_link'
          }, {
            priority: 5,
            id: 'predefined-link'
          });
        } else {
          // Standard link for data output
          return conversionApi.writer.createAttributeElement('a', {
            href: modelAttributeValue as string
          }, {
            priority: 5,
            id: 'link'
          });
        }
      }
    });

    // Add conversion to include linkName as a data attribute for post-processing
    editor.conversion.for('dataDowncast').attributeToAttribute({
      model: 'alightPredefinedLinkPluginLinkName',
      view: 'data-link-name'
    });

    // Post-processor to wrap text content in ah:link for data output
    editor.data.on('get', (evt, data) => {
      // Process the output to wrap predefined link content in ah:link tags
      data[0] = this._wrapPredefinedLinksInOutput(data[0]);
    });
  }

  /**
   * Post-processes HTML output to wrap predefined link content in ah:link tags
   * IMPORTANT: This preserves the original text content and only adds the ah:link wrapper
   */
  private _wrapPredefinedLinksInOutput(html: string): string {
    try {
      // Create a temporary DOM to process the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Find all predefined links (AHCustomeLink class)
      const predefinedLinks = tempDiv.querySelectorAll('a.AHCustomeLink[data-id="predefined_link"]');

      predefinedLinks.forEach(link => {
        // Get the link name from data attributes
        let linkName = link.getAttribute('data-link-name') || 'predefinedLinkName';

        // If we still don't have a good linkName, try to extract it from other sources
        if (!linkName || linkName === 'predefinedLinkName') {
          linkName = this._extractLinkNameFromElement(link);
        }

        // PRESERVE THE ORIGINAL TEXT CONTENT - don't modify it!
        const originalContent = link.innerHTML;

        // Only wrap if there isn't already an ah:link element
        if (!link.querySelector('ah\\:link') && !originalContent.includes('<ah:link')) {
          // Wrap the EXISTING content in ah:link, preserving whatever text/HTML was there
          link.innerHTML = `<ah:link name="${this._escapeAttribute(linkName)}">${originalContent}</ah:link>`;
        }
      });

      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Error wrapping predefined links:', error);
      return html;
    }
  }

  /**
   * Helper to extract link name from element attributes and fallbacks
   */
  private _extractLinkNameFromElement(element: Element): string {
    // Try various attributes and fallbacks
    const linkName = element.getAttribute('data-link-name') ||
      element.getAttribute('data-predefined-name') ||
      element.getAttribute('title') ||
      'predefinedLinkName';

    return linkName;
  }

  /**
   * Helper to escape HTML attributes
   */
  private _escapeAttribute(text: string): string {
    return text.replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Adds linking commands to the editor
   */
  private _addLinkingCommands(editor: Editor): void {
    // Create link commands
    const linkCommand = new AlightPredefinedLinkPluginCommand(editor);
    const unlinkCommand = new AlightPredefinedLinkPluginUnlinkCommand(editor);

    // Add under our custom command names
    editor.commands.add('alight-predefined-link', linkCommand);
    editor.commands.add('alight-predefined-unlink', unlinkCommand);
  }

  /**
   * Configures link decorators
   */
  private _configureDecorators(editor: Editor): void {
    const linkDecorators = getLocalizedDecorators(
      editor.t,
      normalizeDecorators(editor.config.get('link.decorators'))
    );

    // Process automatic decorators
    const automaticDecoratorDefinitions = linkDecorators
      .filter((item): item is NormalizedLinkDecoratorAutomaticDefinition =>
        item.mode === DECORATOR_AUTOMATIC
      );

    // Process manual decorators  
    const manualDecoratorDefinitions = linkDecorators
      .filter((item): item is NormalizedLinkDecoratorManualDefinition =>
        item.mode === DECORATOR_MANUAL
      );

    this._enableAutomaticDecorators(automaticDecoratorDefinitions);
    this._enableManualDecorators(manualDecoratorDefinitions);
  }

  /**
   * Enables two-step caret movement
   */
  private _enableTwoStepCaretMovement(editor: Editor): void {
    const twoStepCaretMovementPlugin = editor.plugins.get(TwoStepCaretMovement);

    // Register link attributes for proper caret movement
    twoStepCaretMovementPlugin.registerAttribute('alightPredefinedLinkPluginHref');
  }

  /**
   * Sets up link highlight
   */
  private _setupLinkHighlight(editor: Editor): void {
    // Register highlighting for link types
    inlineHighlight(editor, 'alightPredefinedLinkPluginHref', 'a', HIGHLIGHT_CLASS);
  }

  /**
   * Processes configured automatic decorators
   */
  private _enableAutomaticDecorators(
    automaticDecoratorDefinitions: NormalizedLinkDecoratorAutomaticDefinition[]
  ): void {
    const editor = this.editor;
    const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const automaticDecorators = command.automaticDecorators;

    if (automaticDecoratorDefinitions.length) {
      automaticDecoratorDefinitions.forEach(definition => {
        automaticDecorators.add(definition);
      });
    }
  }

  /**
   * Processes configured manual decorators
   */
  private _enableManualDecorators(
    manualDecoratorDefinitions: NormalizedLinkDecoratorManualDefinition[]
  ): void {
    if (!manualDecoratorDefinitions.length) {
      return;
    }

    const editor = this.editor;
    const command = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const manualDecorators = command.manualDecorators;

    manualDecoratorDefinitions.forEach(decoratorDefinition => {
      // Extend schema to allow the decorator attribute
      editor.model.schema.extend('$text', {
        allowAttributes: [decoratorDefinition.id]
      });

      // Create manual decorator
      const decorator = new ManualDecorator({
        ...decoratorDefinition
      });

      manualDecorators.add(decorator);

      // Add conversion for manual decorators
      editor.conversion.for('downcast').attributeToAttribute({
        model: decorator.id,
        view: (attributeValue) => {
          if (!attributeValue || !decorator.attributes) {
            return null;
          }

          // Return the first attribute key-value pair
          const firstKey = Object.keys(decorator.attributes)[0];
          return {
            key: firstKey,
            value: decorator.attributes[firstKey]
          };
        }
      });

      // Upcast conversion for manual decorator
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
}

/**
 * Removes link-related attributes from the current selection
 */
export function removeLinkAttributesFromSelection(writer: Writer, linkAttributes: Array<string>): void {
  // Remove core link attributes
  writer.removeSelectionAttribute('alightPredefinedLinkPluginHref');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginLinkName');
  writer.removeSelectionAttribute('alightPredefinedLinkPluginFormat');

  // Remove any additional link-related attributes
  for (const attribute of linkAttributes) {
    writer.removeSelectionAttribute(attribute);
  }
}

/**
 * Retrieves link-related attributes allowed on text elements
 */
export function getLinkAttributesAllowedOnText(schema: Schema): Array<string> {
  const textAttributes = schema.getDefinition('$text')!.allowAttributes;
  return textAttributes.filter(attribute =>
    attribute.startsWith('link') ||
    attribute.startsWith('alightPredefinedLinkPlugin')
  );
}
