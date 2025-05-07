// src/plugins/alight-existing-document-link-plugin/linkpluginintegration.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { isExistingDocumentLink } from './utils';

export default class AlightExternalLinkPluginIntegration extends Plugin {
  public static get pluginName() {
    return 'AlightExternalLinkPluginIntegration' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Check if standard link plugin is available
    if (editor.plugins.has('Link')) {
      // Get the standard link UI plugin
      const standardLinkUI = editor.plugins.get('LinkUI');
      const standardLinkCommand = editor.commands.get('link');

      // Override the standard link UI's _showUI method to check for existing document links
      // Note: Changed showUI to _showUI to match the actual method name
      const originalShowUI = standardLinkUI._showUI.bind(standardLinkUI);
      standardLinkUI._showUI = function (isEditing: boolean) {
        // Check if the current selection is in a existing document link
        const command = editor.commands.get('link');
        if (command && command.value && isExistingDocumentLink(command.value as string)) {
          // If it's a existing document link, use our plugin instead
          const existingDocumentLinkUI = editor.plugins.get('AlightExistingDocumentLinkPluginUI');
          existingDocumentLinkUI.showUI(isEditing);
          return;
        }

        // Otherwise, use the original method
        originalShowUI(isEditing);
      };

      // Add listener to the standard link command to prevent editing existing document links
      if (standardLinkCommand) {
        standardLinkCommand.on('execute', (evt, args) => {
          // Cast args[0] to string explicitly since TypeScript doesn't know its type
          const href = args[0] as string;
          const selection = editor.model.document.selection;

          // If selection has alightExistingDocumentLinkPlugin attribute, it's a existing document link
          if (selection.hasAttribute('alightExistingDocumentLinkPluginHref')) {
            const currentHref = selection.getAttribute('alightExistingDocumentLinkPluginHref');
            if (isExistingDocumentLink(currentHref as string)) {
              // Stop execution of the standard link command for existing document links
              evt.stop();
              // Execute our command instead
              editor.execute('alight-existing-document-link', href);
            }
          }
        }, { priority: 'high' });
      }
    }
  }
}
