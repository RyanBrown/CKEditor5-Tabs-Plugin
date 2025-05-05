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
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data;

        // Find all links with AHCustomeLink class
        const links = tempDiv.querySelectorAll('a.AHCustomeLink');

        links.forEach(link => {
          // Store the text content before processing
          const linkText = link.textContent || '';

          // Get the link name from the data attribute or use the link text as fallback
          const linkName = link.getAttribute('data-link-name') || link.textContent || '';

          // Remove all attributes from the link
          while (link.attributes.length > 0) {
            link.removeAttribute(link.attributes[0].name);
          }

          // Add only the required attributes
          link.setAttribute('href', '#');
          link.classList.add('AHCustomeLink');
          link.setAttribute('data-id', 'predefined_link');

          // Check if this link already has an ah:link child
          const existingAhLink = link.querySelector('ah\\:link') || link.querySelector('ah:link');

          if (!existingAhLink) {
            // Create the ah:link element with ONLY the name attribute
            const ahLink = document.createElement('ah:link');
            ahLink.setAttribute('name', linkName);

            // Move content to ah:link
            while (link.firstChild) {
              ahLink.appendChild(link.firstChild);
            }

            // Add ah:link to link
            link.appendChild(ahLink);
          } else {
            // Remove all attributes from ah:link
            while (existingAhLink.attributes.length > 0) {
              existingAhLink.removeAttribute(existingAhLink.attributes[0].name);
            }

            // Add back only the name attribute
            existingAhLink.setAttribute('name', linkName);
          }
        });

        return tempDiv.innerHTML;
      } catch (error) {
        console.error('Error processing links in output:', error);
        // Return original data if there was an error
        return data;
      }
    };
  }
}
