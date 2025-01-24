// src/plugins/alight-link-url-plugin/alight-link-url-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ViewElement } from '@ckeditor/ckeditor5-engine';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import { UpcastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/upcastdispatcher';
import AlightLinkUrlCommand from './alight-link-url-plugin-command';

export default class AlightLinkUrlPluginEditing extends Plugin {
  static get pluginName() {
    return 'AlightLinkUrlPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Extend schema to allow link attributes on $text
    editor.model.schema.extend('$text', {
      allowAttributes: ['linkHref'],
    });

    // Downcast: linkHref => <a href="...">
    editor.conversion.for('downcast').attributeToElement({
      model: {
        name: '$text',
        key: 'linkHref',
      },
      view: (hrefValue: string, { writer }: { writer: DowncastConversionApi['writer'] }) => {
        if (!hrefValue) {
          return;
        }
        return writer.createAttributeElement('a', { href: hrefValue }, { priority: 5 });
      }
    });

    // Upcast: <a href="..."> => linkHref
    editor.conversion.for('upcast').elementToAttribute({
      view: 'a',
      model: {
        key: 'linkHref',
        value: (viewElement: ViewElement /*, conversionApi: UpcastConversionApi */) => {
          return viewElement.getAttribute('href');
        }
      }
    });

    // Register the command
    editor.commands.add('alightLinkUrlCommand', new AlightLinkUrlCommand(editor));
  }
}
