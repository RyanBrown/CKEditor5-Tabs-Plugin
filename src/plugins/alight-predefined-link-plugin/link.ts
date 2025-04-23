// src/plugins/alight-predefined-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPredefinedLinkPluginEditing from './linkediting';
import AlightPredefinedLinkPluginUI from './linkui';
import AlightPredefinedLinkPluginAutoLink from './autolink';
import AlightPredefinedLinkPluginIntegration from './linkpluginintegration';
import './styles/alight-predefined-link-plugin.scss';
import { isPredefinedLink, extractPredefinedLinkId } from './utils';

/**
 * The Alight Predefined link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightPredefinedLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [
      AlightPredefinedLinkPluginEditing,
      AlightPredefinedLinkPluginUI,
      AlightPredefinedLinkPluginAutoLink,
      AlightPredefinedLinkPluginIntegration
    ] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkPlugin' as const;
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
  public init(): void {
    // The UI component is already registered by AlightPredefinedLinkPluginUI plugin

    // Register additional plugin-specific behaviors
    this._handleLinkInterception();

    // Allow onclick attribute by patching the schema
    this._allowOnclickAttribute();

    // Disable unsafe attribute detection
    this._disableUnsafeAttributeDetection();
  }

  // Add this new method
  private _disableUnsafeAttributeDetection(): void {
    const editor = this.editor;

    try {
      const domConverter = editor.editing.view.domConverter;

      // Override the unsafe attribute detection
      // @ts-ignore - Accessing private method
      if (domConverter._isDomAttributeSafe) {
        // @ts-ignore - Override private method
        domConverter._isDomAttributeSafe = function (domElement, key) {
          // Always return true for links
          if (domElement.tagName && domElement.tagName.toLowerCase() === 'a') {
            return true;
          }
          return true; // Always allow all attributes
        };
      }
    } catch (error) {
      console.warn('Could not disable unsafe attribute detection:', error);
    }
  }

  /**
   * Allows onclick attribute on anchor elements
   */
  private _allowOnclickAttribute(): void {
    const editor = this.editor;

    try {
      const domConverter = editor.editing.view.domConverter;

      // Override the unsafe attribute detection method directly
      // @ts-ignore - Accessing private method
      if (domConverter._isDomAttributeSafe) {
        // @ts-ignore - Override private method
        const originalIsDomAttributeSafe = domConverter._isDomAttributeSafe;
        // @ts-ignore
        domConverter._isDomAttributeSafe = function (domElement, key) {
          // Allow all attributes for anchor elements
          if (domElement && domElement.tagName &&
            domElement.tagName.toLowerCase() === 'a') {
            return true;
          }
          // For other elements, use the original behavior
          return originalIsDomAttributeSafe.call(this, domElement, key);
        };
      }

      // The rest of your existing _allowOnclickAttribute code...
      // Store the original method
      // @ts-ignore - We're using a private method that may not be in TypeScript definitions
      const originalShouldRenderAttribute = domConverter._shouldRenderAttribute;

      // Override the method to allow onclick on a elements
      // @ts-ignore - We're using a private method that may not be in TypeScript definitions
      domConverter._shouldRenderAttribute = function (element: any, key: string, value: any) {
        // Allow all attributes on 'a' elements
        if (element && element.name === 'a') {
          return true;
        }

        // Call the original method for all other cases
        return originalShouldRenderAttribute.call(this, element, key, value);
      };

      // Your existing MutationObserver code...
    } catch (error) {
      console.warn('Could not patch DomConverter to allow onclick attribute:', error);
    }
  }

  /**
   * Configures the editor to intercept link creation/editing of predefined links
   */
  private _handleLinkInterception(): void {
    const editor = this.editor;

    editor.model.document.on('change', () => {
      editor.model.change(writer => {
        const changes = editor.model.document.differ.getChanges();
        const updatedNodes = new Set();

        for (const change of changes) {
          if (change.type === 'insert' || change.type === 'attribute') {
            const range = change.type === 'insert' ?
              editor.model.createRange(change.position, change.position.getShiftedBy(1)) :
              change.range;

            if (!range) continue;

            for (const item of range.getItems()) {
              if (item.is('$text') && !updatedNodes.has(item)) {
                if (item.hasAttribute('alightPredefinedLinkPluginHref')) {
                  const href = item.getAttribute('alightPredefinedLinkPluginHref');

                  if (isPredefinedLink(href as string)) {
                    // Always set AHCustomeLink format for predefined links
                    writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', item);

                    // Extract and set link name
                    const linkId = extractPredefinedLinkId(href as string);
                    if (linkId) {
                      writer.setAttribute('alightPredefinedLinkPluginLinkName', linkId, item);
                    }
                  }

                  updatedNodes.add(item);
                }
              }
            }
          }
        }
      });
    });
  }
}
