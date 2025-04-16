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
  }

  /**
   * Configures the editor to intercept link creation/editing of predefined links
   */
  private _handleLinkInterception(): void {
    const editor = this.editor;

    // Check for existing links when content is loaded
    editor.model.document.on('change', () => {
      // Ensure that all predefined links have the correct attributes
      editor.model.change(writer => {
        const changes = editor.model.document.differ.getChanges();
        const updatedNodes = new Set();

        for (const change of changes) {
          // Handle different types of changes with proper type checking
          if (change.type === 'insert') {
            // For insert changes, check the nodeAfter
            const nodeAfter = change.position?.nodeAfter;

            if (nodeAfter && nodeAfter.is('$text') && !updatedNodes.has(nodeAfter)) {
              // Check if the text has a link attribute
              if (nodeAfter.hasAttribute('alightPredefinedLinkPluginHref')) {
                const href = nodeAfter.getAttribute('alightPredefinedLinkPluginHref');

                // If it's a predefined link but missing format, add standard format
                if (isPredefinedLink(href as string) && !nodeAfter.hasAttribute('alightPredefinedLinkPluginFormat')) {
                  writer.setAttribute('alightPredefinedLinkPluginFormat', 'standard', nodeAfter);

                  // Also extract and set link name if possible
                  const linkId = extractPredefinedLinkId(href as string);
                  if (linkId && !nodeAfter.hasAttribute('alightPredefinedLinkPluginLinkName')) {
                    writer.setAttribute('alightPredefinedLinkPluginLinkName', linkId, nodeAfter);
                  }
                }

                updatedNodes.add(nodeAfter);
              }
            }
          } else if (change.type === 'attribute') {
            // For attribute changes, we need to handle differently because the structure is different
            // We need to access the element differently based on the change type
            if (!change.range) continue;

            // Process all items in the range
            for (const item of change.range.getItems()) {
              if (item.is('$text') && !updatedNodes.has(item)) {
                // Check if the text has a link attribute
                if (item.hasAttribute('alightPredefinedLinkPluginHref')) {
                  const href = item.getAttribute('alightPredefinedLinkPluginHref');

                  // If it's a predefined link but missing format, add standard format
                  if (isPredefinedLink(href as string) && !item.hasAttribute('alightPredefinedLinkPluginFormat')) {
                    writer.setAttribute('alightPredefinedLinkPluginFormat', 'standard', item);

                    // Also extract and set link name if possible
                    const linkId = extractPredefinedLinkId(href as string);
                    if (linkId && !item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
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
