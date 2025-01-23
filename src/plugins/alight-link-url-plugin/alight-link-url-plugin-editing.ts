// alight-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkCommand from './alight-link-url-plugin-command';

// We need these imports for properly typing the downcast converters:
import { ViewElement } from '@ckeditor/ckeditor5-engine';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import { UpcastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/upcastdispatcher';

export default class AlightLinkUrlPluginEditing extends Plugin {
  // The plugin's name.
  static get pluginName() {
    return 'AlightLinkUrlPluginEditing';
  }

  // Initializes the plugin:
  init() {
    const editor = this.editor;

    // Extend schema to allow link attributes on text nodes
    editor.model.schema.extend('$text', {
      allowAttributes: ['linkHref'],
    });

    // Downcast Converters - If the text has linkHref, we create an <a> element with href.
    editor.conversion.for('downcast').attributeToElement({
      model: {
        name: '$text',
        key: 'linkHref',
      },
      // attributeValue -> string, { writer } -> an object with writer
      view: (hrefValue: string, { writer }) => {
        if (!hrefValue) return;
        return writer.createAttributeElement('a', { href: hrefValue }, { priority: 5 });
      },
    });

    // Upcast Converters - If we see an <a> element in the HTML, grab href and set them in the model as linkHref.
    editor.conversion.for('upcast').elementToAttribute({
      view: 'a',
      model: {
        key: 'linkHref',
        // The callback type can be typed with UpcastConversionApi if needed.
        value: (viewElement: ViewElement /*, conversionApi: UpcastConversionApi */) => {
          return viewElement.getAttribute('href');
        },
      },
    });

    // Register the link command
    editor.commands.add('alightLinkPlugin', new AlightLinkCommand(editor));
  }
}
