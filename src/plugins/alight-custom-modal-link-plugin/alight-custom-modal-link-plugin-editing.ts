// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginCommand } from './alight-custom-modal-link-plugin-command';

export class AlightCustomModalLinkPluginEditing extends Plugin {
  public static get requires() {
    return []; // No dependency on LinkEditing
  }

  public static get pluginName() {
    return 'AlightCustomModalLinkPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Register the command
    editor.commands.add('alightCustomModalLinkPlugin', new AlightCustomModalLinkPluginCommand(editor));

    // Downcast: Convert model attribute to view element <a>
    editor.conversion.for('downcast').attributeToElement({
      model: 'customHref',
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', { href }, { priority: 5 });
      }
    });

    // Upcast: Convert <a> elements in view to customHref in model
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: { href: true }
      },
      model: {
        key: 'customHref',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => viewElement.getAttribute('href')
      }
    });
  }
}
