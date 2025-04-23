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
  }

  /**
   * Allows onclick attribute on anchor elements
   */
  private _allowOnclickAttribute(): void {
    const editor = this.editor;

    // Monkey patch the DomConverter's _shouldRenderAttribute method to allow onclick on 'a' elements
    // This approach doesn't rely on the setExtensionChecker method
    try {
      const domConverter = editor.editing.view.domConverter;

      // Store the original method
      // @ts-ignore - We're using a private method that may not be in TypeScript definitions
      const originalShouldRenderAttribute = domConverter._shouldRenderAttribute;

      // Override the method
      // @ts-ignore - We're using a private method that may not be in TypeScript definitions
      domConverter._shouldRenderAttribute = function (element, key, value) {
        // Allow 'onclick' attribute on 'a' elements
        if (element.name === 'a' && key === 'onclick') {
          return true;
        }

        // Call the original method for all other cases
        return originalShouldRenderAttribute.call(this, element, key, value);
      };
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
