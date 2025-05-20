// src/plugins/alight-predefined-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPredefinedLinkPluginEditing from './linkediting';
import AlightPredefinedLinkPluginUI from './linkui';
import AlightPredefinedLinkPluginAutoLink from './autolink';
import AlightPredefinedLinkPluginIntegration from './linkpluginintegration';
import './styles/alight-predefined-link-plugin.scss';
import {
  isPredefinedLink,
  extractPredefinedLinkId,
  ensurePredefinedLinkStructure
} from './utils';

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
    // Register additional plugin-specific behaviors
    this._handleLinkInterception();

    // Register a data processor to ensure proper format in getData() output
    this._registerDataProcessor();
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

                  // Always set AHCustomeLink format for all links
                  writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', item);

                  // Extract and set link name - always ensure we have a linkName
                  let linkName = '';

                  if (isPredefinedLink(href as string)) {
                    linkName = extractPredefinedLinkId(href as string);
                  }

                  // If no valid linkId, try to use existing linkName or reject
                  if (!linkName || linkName.trim() === '') {
                    linkName = item.getAttribute('alightPredefinedLinkPluginLinkName') as string;
                    if (!linkName || linkName.trim() === '') {
                      // Log error when no valid linkName is found
                      console.error('AlightPredefinedLinkPlugin: No valid predefinedLinkName found for link. Link creation aborted.', { href });

                      // Remove the href attribute to prevent the link from being created
                      writer.removeAttribute('alightPredefinedLinkPluginHref', item);
                      updatedNodes.add(item);

                      // Skip setting other attributes
                      continue;
                    }
                  }

                  // Always set the linkName attribute
                  writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, item);
                  updatedNodes.add(item);
                }
              }
            }
          }
        }
      });
    });
  }

  /**
   * Registers a data processor that ensures links have the proper structure in output data
   */
  private _registerDataProcessor(): void {
    const editor = this.editor;
    const dataProcessor = editor.data.processor;

    // Get the original toData method
    const originalToData = dataProcessor.toData;

    // Override the toData method to ensure proper link structure in output
    dataProcessor.toData = function (viewFragment) {
      // Call the original method
      const data = originalToData.call(this, viewFragment);

      // Process the HTML string to ensure proper link structure
      try {
        // Use the ensure structure function directly
        return ensurePredefinedLinkStructure(data);
      } catch (error) {
        console.error('Error processing links in output:', error);
        // Return original data if there was an error
        return data;
      }
    };
  }
}
