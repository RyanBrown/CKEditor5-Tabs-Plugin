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

    // Register the orgNameSpan element
    editor.model.schema.register('orgNameSpan', {
      allowWhere: '$text',
      allowContentOf: '$text',
      allowAttributes: ['class', 'linkHref']
    });

    // Conversion for orgNameSpan - two-way conversion rules
    editor.conversion.for('downcast').elementToElement({
      model: 'orgNameSpan',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('span', { class: 'org-name-append' });
      }
    });

    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['org-name-append']
      },
      model: 'orgNameSpan'
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
