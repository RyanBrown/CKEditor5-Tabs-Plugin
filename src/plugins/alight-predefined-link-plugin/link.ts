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
   * Track processing state per text node to avoid conflicts
   */
  private _processingNodes = new WeakSet();
  private _pendingChanges = new Set();
  private _processingTimeout: number | null = null;

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
    // Only handle user-initiated link commands, not data loading
    this._handleLinkCommandExecution();

    // Register a data processor to ensure proper format in getData() output
    this._registerDataProcessor();
  }

  /**
   * Handle only explicit link command execution
   * This prevents interference during data loading/upcast
   */
  private _handleLinkCommandExecution(): void {
    const editor = this.editor;

    // Use a more targeted approach - only listen to command execution
    const linkCommand = editor.commands.get('alight-predefined-link');

    if (linkCommand) {
      // Listen only to explicit command execution
      linkCommand.on('execute', (evt, args) => {
        // This will only run when the user explicitly executes the link command
        // Not during data loading/upcast
        const href = args[0] as string;

        if (isPredefinedLink(href)) {
          // Schedule processing after command execution completes
          setTimeout(() => {
            this._processNewPredefinedLink(href);
          }, 0);
        }
      }, { priority: 'low' });
    }
  }

  /**
   * Process only newly created predefined links
   */
  private _processNewPredefinedLink(href: string): void {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    // Only process if we have a valid selection with the href
    if (!selection.hasAttribute('alightPredefinedLinkPluginHref')) {
      return;
    }

    const currentHref = selection.getAttribute('alightPredefinedLinkPluginHref');
    if (currentHref !== href) {
      return;
    }

    editor.model.change(writer => {
      const ranges = selection.isCollapsed ?
        [editor.model.createRange(selection.getFirstPosition(), selection.getLastPosition())] :
        Array.from(selection.getRanges());

      for (const range of ranges) {
        for (const item of range.getItems()) {
          if (item.is('$text') &&
            item.hasAttribute('alightPredefinedLinkPluginHref') &&
            item.getAttribute('alightPredefinedLinkPluginHref') === href &&
            !this._processingNodes.has(item)) {

            this._processingNodes.add(item);
            this._ensurePredefinedLinkAttributes(writer, item, href);
          }
        }
      }
    });
  }

  /**
   * Ensure predefined link has all required attributes
   */
  private _ensurePredefinedLinkAttributes(writer: any, item: any, href: string): void {
    const attributesToSet = new Map<string, any>();

    // Set format if not present
    if (!item.hasAttribute('alightPredefinedLinkPluginFormat')) {
      attributesToSet.set('alightPredefinedLinkPluginFormat', 'ahcustom');
    }

    // Set link name if not present
    if (!item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      let linkName = extractPredefinedLinkId(href);
      if (!linkName || linkName.trim() === '') {
        linkName = 'link-' + Math.random().toString(36).substring(2, 7);
      }
      attributesToSet.set('alightPredefinedLinkPluginLinkName', linkName);
    }

    // Apply all attributes atomically
    attributesToSet.forEach((value, key) => {
      writer.setAttribute(key, value, item);
    });
  }

  /**
   * Simplified data processor registration
   */
  private _registerDataProcessor(): void {
    const editor = this.editor;
    const dataProcessor = editor.data.processor;

    // Safely check if toData method exists
    if (!dataProcessor || typeof dataProcessor.toData !== 'function') {
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
        return originalToData(viewFragment);
      }
    };
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  public override destroy(): void {
    if (this._processingTimeout) {
      clearTimeout(this._processingTimeout);
    }
    this._processingNodes = new WeakSet();
    this._pendingChanges.clear();
    super.destroy();
  }
}
