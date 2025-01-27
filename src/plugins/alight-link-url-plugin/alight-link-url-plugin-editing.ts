// src/plugins/alight-link-url-plugin/alight-link-url-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkUrlPluginCommand from './alight-link-url-plugin-command';

// We need these imports for properly typing the downcast converters:
import { ViewElement } from '@ckeditor/ckeditor5-engine';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';

export default class AlightLinkUrlPluginEditing extends Plugin {
  static get pluginName() {
    return 'AlightLinkUrlPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Extend schema to allow linkHref and orgNameText on $text
    editor.model.schema.extend('$text', {
      allowAttributes: ['linkHref', 'orgNameText'],
    });

    // Downcast: Convert linkHref to <a href="...">
    editor.conversion.for('downcast').attributeToElement({
      model: {
        name: '$text',
        key: 'linkHref',
      },
      view: (hrefValue: string, { writer }: { writer: DowncastConversionApi['writer'] }) => {
        if (!hrefValue) {
          return;
        }
        return writer.createContainerElement('a', { href: hrefValue, class: 'ck-link_selected' });
      },
    });

    // Upcast: Extract linkHref from <a>
    editor.conversion.for('upcast').elementToAttribute({
      view: 'a',
      model: {
        key: 'linkHref',
        value: (viewElement: ViewElement) => viewElement.getAttribute('href'),
      },
    });

    // Register the command
    editor.commands.add('alightLinkUrlPluginCommand', new AlightLinkUrlPluginCommand(editor));
  }
}
