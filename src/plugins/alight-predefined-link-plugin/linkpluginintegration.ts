// src/plugins/alight-predefined-link-plugin/linkpluginintegration.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { isPredefinedLink } from './utils';

export default class AlightPredefinedLinkPluginIntegration extends Plugin {
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginIntegration' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Check if standard link plugin is available
    if (editor.plugins.has('Link')) {
      // Get the standard link UI plugin
      const standardLinkUI = editor.plugins.get('LinkUI');
      const standardLinkCommand = editor.commands.get('link');

      // Override the standard link UI's _showUI method to check for predefined links
      // Note: Changed showUI to _showUI to match the actual method name
      const originalShowUI = standardLinkUI._showUI.bind(standardLinkUI);
      standardLinkUI._showUI = function (isEditing: boolean) {
        // Check if the current selection is in a predefined link
        const command = editor.commands.get('link');
        if (command && command.value && isPredefinedLink(command.value as string)) {
          // If it's a predefined link, use our plugin instead
          const predefinedLinkUI = editor.plugins.get('AlightPredefinedLinkPluginUI');
          predefinedLinkUI.showUI(isEditing);
          return;
        }

        // Otherwise, use the original method
        originalShowUI(isEditing);
      };

      // Add listener to the standard link command to prevent editing predefined links
      if (standardLinkCommand) {
        standardLinkCommand.on('execute', (evt, args) => {
          // Cast args[0] to string explicitly since TypeScript doesn't know its type
          const href = args[0] as string;
          const selection = editor.model.document.selection;

          // If selection has alightPredefinedLinkPluginHref attribute, it's a predefined link
          if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
            const currentHref = selection.getAttribute('alightPredefinedLinkPluginHref');
            if (isPredefinedLink(currentHref as string)) {
              // Stop execution of the standard link command for predefined links
              evt.stop();
              // Execute our command instead
              editor.execute('alight-predefined-link', href);
            }
          }
        }, { priority: 'high' });
      }
    }
  }
}
