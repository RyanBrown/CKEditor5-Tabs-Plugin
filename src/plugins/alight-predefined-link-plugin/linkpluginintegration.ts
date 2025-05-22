// src/plugins/alight-predefined-link-plugin/linkpluginintegration.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { isPredefinedLink } from './utils';

/**
 * Integration with the standard Link plugin
 */
export default class AlightPredefinedLinkPluginIntegration extends Plugin {
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginIntegration' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Check if standard link plugin is available
    if (editor.plugins.has('Link')) {
      this._integrateWithStandardLinkUI();
      this._integrateWithStandardLinkCommand();
    }
  }

  /**
   * Integrates with the standard Link UI plugin
   */
  private _integrateWithStandardLinkUI(): void {
    const editor = this.editor;

    try {
      // Get the standard link UI plugin
      // Using any type here since we don't know the internal structure of the standard LinkUI plugin
      const standardLinkUI = editor.plugins.get('LinkUI') as any;

      // Make sure we'll try to use our custom UI for predefined links
      if (standardLinkUI && typeof standardLinkUI._showUI === 'function') {
        // Store the original method
        const originalShowUI = standardLinkUI._showUI.bind(standardLinkUI);

        // Override the standard link UI's _showUI method to check for predefined links
        standardLinkUI._showUI = function (isEditing: boolean) {
          // Check if the current selection is in a predefined link
          const command = editor.commands.get('link');

          if (command && command.value && isPredefinedLink(command.value as string)) {
            // If it's a predefined link, try to use our plugin instead
            const predefinedLinkUI = editor.plugins.get('AlightPredefinedLinkPluginUI') as any;

            if (predefinedLinkUI && typeof predefinedLinkUI.showUI === 'function') {
              predefinedLinkUI.showUI(isEditing);
              return;
            }
          }

          // Otherwise, use the original method
          originalShowUI(isEditing);
        };
      }
    } catch (error) {
      console.error('Error integrating with Link UI:', error);
    }
  }

  /**
   * Integrates with the standard Link command
   */
  private _integrateWithStandardLinkCommand(): void {
    const editor = this.editor;

    try {
      // Get the standard link command
      const standardLinkCommand = editor.commands.get('link');

      if (standardLinkCommand) {
        // Add listener to the standard link command to prevent editing predefined links
        standardLinkCommand.on('execute', (evt, args: any[]) => {
          // Extract href from args
          const href = args && args.length > 0 ? args[0] : undefined;

          if (typeof href !== 'string') {
            return;
          }

          const selection = editor.model.document.selection;

          // If selection has alightPredefinedLinkPluginHref attribute, it's a predefined link
          if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
            const currentHref = selection.getAttribute('alightPredefinedLinkPluginHref');

            if (typeof currentHref === 'string' && isPredefinedLink(currentHref)) {
              // Stop execution of the standard link command for predefined links
              evt.stop();

              // Execute our command instead
              editor.execute('alight-predefined-link', href);
            }
          }

          // Also check if the new href is a predefined link format
          if (isPredefinedLink(href)) {
            // Stop execution of the standard link command
            evt.stop();

            // Execute our command instead
            editor.execute('alight-predefined-link', href);
          }
        }, { priority: 'high' });
      }
    } catch (error) {
      console.error('Error integrating with Link command:', error);
    }
  }
}
