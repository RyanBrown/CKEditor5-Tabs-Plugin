// src/plugins/alight-public-link-plugin/alight-public-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { type Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkCommand from './alight-public-link-plugin-command';

export default class AlightPublicLinkEditing extends Plugin {
  public static get pluginName() {
    return 'AlightPublicLinkEditing' as const;
  }

  public static get requires() {
    return [Link];
  }

  public init(): void {
    const editor = this.editor;
    this._defineConverters();
    this._defineCommands();
  }

  private _defineConverters(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Conversion from model to view
    conversion.for('downcast').attributeToElement({
      model: 'alightPublicLinkPlugin',
      view: (value, { writer }) => {
        return writer.createAttributeElement('a', {
          href: value,
          class: 'public-link',
          target: '_blank',
          rel: 'noopener noreferrer'
        });
      }
    });

    // Conversion from view to model
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: true,
          class: 'public-link'
        }
      },
      model: {
        key: 'alightPublicLinkPlugin',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => viewElement.getAttribute('href')
      }
    });
  }

  private _defineCommands(): void {
    const editor = this.editor;
    editor.commands.add('alightPublicLinkPlugin', new AlightPublicLinkCommand(editor));
  }
}