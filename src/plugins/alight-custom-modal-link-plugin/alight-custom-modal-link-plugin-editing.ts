// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginCommand, CommandData } from './alight-custom-modal-link-plugin-command';

export class AlightCustomModalLinkPluginEditing extends Plugin {
  public static get requires() {
    return []; // No dependency on LinkEditing
  }

  public static get pluginName() {
    return 'AlightCustomModalLinkPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Create proper CommandData object
    const commandData: CommandData = {
      title: 'Insert Link',
      modalOptions: {
        width: '400px',
      },
      buttons: [
        {
          label: 'Insert',
          className: 'ck-button-primary',
          onClick: () => this.handleInsert()
        }
      ],
      loadContent: async () => {
        return `
          <div class="ck-labeled-field-view">
            <input type="text" class="ck-input-text" id="link-url" placeholder="https://" />
          </div>
        `;
      }
    };

    // Register the command with proper data
    editor.commands.add(
      'alightCustomModalLinkPlugin',
      new AlightCustomModalLinkPluginCommand(editor, commandData)
    );

    // Conversion setup
    editor.conversion.for('downcast').attributeToElement({
      model: 'customHref',
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', { href }, { priority: 5 });
      }
    });

    editor.conversion.for('upcast').attributeToAttribute({
      view: {
        name: 'a', attributes: ['href']
      },
      model: {
        key: 'customHref',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => viewElement.getAttribute('href')
      }
    });
  }

  private handleInsert(): void {
    // Implementation of insert handling
  }
}
