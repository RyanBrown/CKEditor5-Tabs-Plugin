// src/plugins/alight-predefined-link-plugin/linkpluginintegration.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { isPredefinedLink } from './utils';

export default class AlightPredefinedLinkPluginIntegration extends Plugin {
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginIntegration' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Only integrate if the standard Link plugin is available
    if (editor.plugins.has('Link')) {
      // Get the standard link UI plugin and command
      const standardLinkUI = editor.plugins.get('LinkUI');
      const standardLinkCommand = editor.commands.get('link');

      // Override the standard link UI's _showUI method to check for predefined links
      if (standardLinkUI && standardLinkUI._showUI) {
        const originalShowUI = standardLinkUI._showUI.bind(standardLinkUI);
        standardLinkUI._showUI = function (isEditing: boolean) {
          // Check if the current selection has the alightPredefinedLinkPluginHref attribute
          const hasAlightHref = editor.model.document.selection.hasAttribute('alightPredefinedLinkPluginHref');
          const hasStandardHref = editor.model.document.selection.hasAttribute('linkHref');

          // Only override for links that specifically have our predefined link attribute
          // or links that have a predefined link format value
          if (hasAlightHref) {
            const command = editor.commands.get('alight-predefined-link');
            if (command && command.value && isPredefinedLink(command.value as string)) {
              // If it's a predefined link, use our plugin instead
              const predefinedLinkUI = editor.plugins.get('AlightPredefinedLinkPluginUI');
              predefinedLinkUI.showUI(isEditing);
              return;
            }
          }

          // For standard links, use the original method
          originalShowUI(isEditing);
        };
      }

      // Add listener to the standard link command to prevent editing predefined links
      // but only intercept when specific attributes are present
      if (standardLinkCommand) {
        standardLinkCommand.on('execute', (evt, args) => {
          const href = args[0] as string;
          const selection = editor.model.document.selection;

          // Only intercept if the selection has our specific attribute
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

      // Add a check to the standard link plugin's refresh method to avoid
      // enabling it for our predefined links
      if (standardLinkCommand && standardLinkCommand.refresh) {
        const originalRefresh = standardLinkCommand.refresh.bind(standardLinkCommand);
        standardLinkCommand.refresh = function () {
          // Call the original refresh first
          originalRefresh();

          // If our predefined link attributes are present, don't let the standard
          // command be enabled for those links
          const selection = editor.model.document.selection;
          if (selection.hasAttribute('alightPredefinedLinkPluginHref') &&
            !selection.hasAttribute('linkHref')) {
            this.isEnabled = false;
          }
        };
      }
    }
  }
}
