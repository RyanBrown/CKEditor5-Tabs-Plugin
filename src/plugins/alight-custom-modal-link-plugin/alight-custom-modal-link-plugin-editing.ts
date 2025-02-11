// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  AlightCustomModalLinkPluginCommand,
  CommandData
} from './alight-custom-modal-link-plugin-command';

// The editing part of the Alight custom link plugin.
// It sets up the schema, conversion, and the custom command to insert/edit links.
export class AlightCustomModalLinkPluginEditing extends Plugin {
  public static get requires() {
    // We explicitly do NOT depend on the default LinkEditing plugin
    return [];
  }

  public static get pluginName() {
    return 'AlightCustomModalLinkPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Create the CommandData that configures how our modal is displayed
    const commandData: CommandData = {
      title: 'Insert Link',
      modalOptions: {
        width: '400px'
      },
      buttons: [
        {
          label: 'Insert',
          className: 'ck-button-primary',
          closeOnClick: false,
          isPrimary: true
        }
      ],
      loadContent: async () => {
        // This is the HTML that is shown in the modal
        return `
          <div class="ck-labeled-field-view">
            <input type="text" class="ck-input-text" id="link-url" placeholder="https://" />
          </div>
        `;
      }
    };

    // Register the command, providing our custom modal config
    editor.commands.add(
      'alightCustomModalLinkPlugin',
      new AlightCustomModalLinkPluginCommand(editor, commandData)
    );

    // Define how `customHref` is converted to/from the view
    editor.conversion.for('downcast').attributeToElement({
      model: 'customHref',
      view: (href, { writer }) => {
        // Downcast: model attribute -> <a href="...">
        return writer.createAttributeElement('a', { href }, { priority: 5 });
      }
    });

    editor.conversion.for('upcast').attributeToAttribute({
      view: {
        name: 'a',
        attributes: ['href']
      },
      model: {
        key: 'customHref',
        value: (viewElement: { getAttribute: (attr: string) => any }) =>
          viewElement.getAttribute('href')
      }
    });
  }

  // This is called when the user clicks the "Insert" button in the modal.
  // Replace it with your own logic as needed.
  private handleInsert(): void {
    // Implementation of how the plugin might handle the "Insert" action
    // (e.g., you might fetch the input field's value from the modal and call execute(href))
  }
}
