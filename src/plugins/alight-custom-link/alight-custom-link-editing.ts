// src/plugins/alight-custom-link/alight-custom-link-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightCustomLinkCommand from './alight-custom-link-command';

export default class AlightCustomLinkEditing extends Plugin {
  public static get pluginName(): string {
    return 'AlightCustomLinkEditing';
  }

  public init(): void {
    const editor = this.editor;

    // 1. Extend the schema to allow a custom link attribute on text.
    editor.model.schema.extend('$text', {
      allowAttributes: 'dataAlightLink'
    });

    // 2. Register the command under a unique name.
    editor.commands.add('alightCustomLink', new AlightCustomLinkCommand(editor));

    // 3. Define conversion rules.
    editor.conversion.for('downcast').attributeToElement({
      model: 'dataAlightLink',
      view: (value, { writer }) => {
        return writer.createAttributeElement('span', {
          'data-alight-link': value
        });
      }
    });

    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        attributes: ['data-alight-link']
      },
      model: {
        key: 'dataAlightLink',
        value: (viewElement: Element) => viewElement.getAttribute('data-alight-link')
      }
    });
  }
}
