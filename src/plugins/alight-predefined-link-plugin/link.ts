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
   * Track processing state to avoid conflicts
   */
  private _isProcessing = false;

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
   * Only run during user interactions, not during data loading
   */
  private _handleLinkInterception(): void {
    const editor = this.editor;

    // Use a more targeted approach - only listen to command execution
    const linkCommand = editor.commands.get('alight-predefined-link');

    if (linkCommand) {
      linkCommand.on('execute', (evt, args) => {
        // This will only run when the user explicitly executes the link command
        // Not during data loading/upcast
        const href = args[0] as string;

        if (isPredefinedLink(href)) {
          // The command execution itself will handle setting the correct attributes
          // We don't need to do additional processing here
          console.log('Predefined link command executed:', href);
        }
      }, { priority: 'low' });
    }

    // Alternative approach - Listen only to user-initiated changes, not data loading
    editor.model.document.on('change:data', () => {
      // Check editor state instead of non-existent isLoading property
      if (this.editor.state === 'initializing' || this._isProcessing) {
        return;
      }

      this._processUserChanges();
    });
  }

  /**
   * Process changes that are initiated by user interactions with better error handling
   */
  private _processUserChanges(): void {
    const editor = this.editor;

    // Prevent recursive processing
    if (this._isProcessing) {
      return;
    }

    this._isProcessing = true;

    try {
      // Use enqueueChange with proper batch parameter or without batch parameter
      editor.model.enqueueChange(writer => {
        const changes = editor.model.document.differ.getChanges();
        const updatedNodes = new Set();

        for (const change of changes) {
          // Only process attribute changes that are likely user-initiated
          if (change.type === 'attribute' && change.attributeKey === 'alightPredefinedLinkPluginHref') {
            const range = change.range;

            if (!range) continue;

            for (const item of range.getItems()) {
              if (item.is('$text') && !updatedNodes.has(item)) {
                this._processLinkItem(writer, item, updatedNodes);
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error processing user changes:', error);
    } finally {
      this._isProcessing = false;
    }
  }

  /**
   * Process individual link items with better attribute synchronization
   */
  private _processLinkItem(writer: any, item: any, updatedNodes: Set<any>): void {
    if (!item.hasAttribute('alightPredefinedLinkPluginHref')) {
      return;
    }

    const href = item.getAttribute('alightPredefinedLinkPluginHref');

    if (!isPredefinedLink(href as string)) {
      return;
    }

    // Set all attributes atomically to maintain consistency
    const attributesToSet = new Map<string, any>();

    // Only set format if not already set
    if (!item.hasAttribute('alightPredefinedLinkPluginFormat')) {
      attributesToSet.set('alightPredefinedLinkPluginFormat', 'ahcustom');
    }

    // Extract and set link name only if not already set
    if (!item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      const linkId = extractPredefinedLinkId(href as string);
      let linkName = linkId;

      if (!linkName || linkName.trim() === '') {
        linkName = 'link-' + Math.random().toString(36).substring(2, 7);
      }

      attributesToSet.set('alightPredefinedLinkPluginLinkName', linkName);
    }

    // Apply all attributes at once for consistency
    attributesToSet.forEach((value, key) => {
      writer.setAttribute(key, value, item);
    });

    updatedNodes.add(item);
  }

  /**
   * Registers a data processor that ensures links have the proper structure in output data
   */
  private _registerDataProcessor(): void {
    const editor = this.editor;
    const dataProcessor = editor.data.processor;

    // Safely check if toData method exists
    if (!dataProcessor || typeof dataProcessor.toData !== 'function') {
      console.warn('Data processor does not have toData method');
      return;
    }

    // Get the original toData method
    const originalToData = dataProcessor.toData.bind(dataProcessor);

    // Override the toData method to ensure proper link structure in output
    dataProcessor.toData = (viewFragment: any): string => {
      try {
        // Call the original method
        const data = originalToData(viewFragment);

        // Process the HTML string to ensure proper link structure
        return ensurePredefinedLinkStructure(data);
      } catch (error) {
        console.error('Error processing links in output:', error);
        // Fallback: try to call original method again
        try {
          return originalToData(viewFragment);
        } catch (fallbackError) {
          console.error('Error in fallback data processing:', fallbackError);
          return '';
        }
      }
    };
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  public override destroy(): void {
    this._isProcessing = false;
    super.destroy();
  }
}
