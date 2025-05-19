// src/plugins/alight-predefined-link-plugin/linkpluginintegration.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { isPredefinedLink, hasAHCustomeLink, hasPredefinedLinkId } from './utils';

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
      const originalShowUI = standardLinkUI._showUI.bind(standardLinkUI);
      standardLinkUI._showUI = function (isEditing: boolean) {
        // Check if the current selection is in a predefined link
        const linkCommand = editor.commands.get('link');

        // Get the selected link element from the view
        const selection = editor.editing.view.document.selection;
        const selectedElement = selection.getSelectedElement();

        // Use a helper function to get link element at position if selection is collapsed
        const getAncestorLink = (position: any) => {
          if (!position || !position.getAncestors) return null;
          return position.getAncestors().find((ancestor: any) =>
            ancestor.is && ancestor.is('attributeElement') && ancestor.name === 'a'
          );
        };

        // Get the link element - either selected or an ancestor
        const linkElement = selectedElement && selectedElement.is('attributeElement') && selectedElement.name === 'a' ?
          selectedElement : getAncestorLink(selection.getFirstPosition());

        // *** KEY CHANGE: Check for both AHCustomeLink class AND data-id=predefined_link ***
        if (linkElement && hasAHCustomeLink(linkElement) && hasPredefinedLinkId(linkElement)) {
          // If it's a predefined link, use our plugin instead
          const predefinedLinkUI = editor.plugins.get('AlightPredefinedLinkPluginUI');
          predefinedLinkUI.showUI(isEditing);
          return;
        }

        // Otherwise, use the original method for regular links
        originalShowUI(isEditing);
      };

      // Add listener to the standard link command to prevent editing predefined links
      if (standardLinkCommand) {
        standardLinkCommand.on('execute', (evt, args) => {
          const href = args[0] as string;
          const selection = editor.model.document.selection;

          // If selection has alightPredefinedLinkPluginHref attribute, check if it's a predefined link
          if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
            const currentHref = selection.getAttribute('alightPredefinedLinkPluginHref');

            // Get the element to check for AHCustomeLink class
            const ancestors = editor.editing.view.document.selection.getFirstPosition()?.getAncestors() || [];
            const linkElement = ancestors.find(ancestor =>
              ancestor.is && typeof ancestor.is === 'function' && ancestor.is('attributeElement') && ancestor.name === 'a'
            );

            // *** KEY CHANGE: Check URL format, AHCustomeLink class, AND data-id attribute ***
            if (isPredefinedLink(currentHref as string) &&
              linkElement &&
              hasAHCustomeLink(linkElement) &&
              hasPredefinedLinkId(linkElement)) {
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
