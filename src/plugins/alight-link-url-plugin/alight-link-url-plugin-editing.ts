// src/plugins/alight-link-url-plugin/alight-link-url-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkUrlPluginCommand from './alight-link-url-plugin-command';

// We need these imports for properly typing the downcast converters:
import { ViewElement } from '@ckeditor/ckeditor5-engine';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import { UpcastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/upcastdispatcher';

export default class AlightLinkUrlPluginEditing extends Plugin {
  static get pluginName() {
    return 'AlightLinkUrlPluginEditing';
  }

  public init(): void {
    const editor = this.editor;

    // Extend schema to allow link attributes on $text
    editor.model.schema.extend('$text', {
      allowAttributes: ['linkHref', 'orgNameText'],
    });

    // Downcast: linkHref => <a href="..." class="ck-link_selected">
    editor.conversion.for('downcast').attributeToElement({
      model: {
        name: '$text',
        key: 'linkHref',
      },
      view: (hrefValue: string, { writer }: { writer: DowncastConversionApi['writer'] }) => {
        if (!hrefValue) {
          return;
        }
        const linkElement = writer.createContainerElement('a', { href: hrefValue, class: 'ck-link_selected' });
        return linkElement;
      },
    });

    // Downcast: Append orgNameText to the end of the selected text
    editor.conversion.for('downcast').add((dispatcher) => {
      dispatcher.on('attribute:orgNameText:$text', (evt, data, conversionApi) => {
        const { writer } = conversionApi;
        const range = data.range;
        const orgNameTextValue = data.attributeNewValue;

        if (!orgNameTextValue) {
          return;
        }

        const endPosition = range.end;
        const appendedOrgNameText = writer.createText(` (${orgNameTextValue})`);
        const parentContainer = endPosition.parent;

        // Ensure the parent container is a text node
        if (parentContainer.is('element', 'a')) {
          // Insert the appended text at the end of the <a> element
          writer.insert(writer.createPositionAt(parentContainer, 'end'), appendedOrgNameText);
        }
      });
    });

    // Upcast: <a href="..."> => linkHref
    editor.conversion.for('upcast').elementToAttribute({
      view: 'a',
      model: {
        key: 'linkHref',
        value: (viewElement: ViewElement) => {
          return viewElement.getAttribute('href');
        },
      },
    });

    // Upcast: Extract appended text from the view and set it in the model
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        classes: 'appended-text',
      },
      model: {
        key: 'orgNameText',
        value: (viewElement: ViewElement) => {
          const textNode = viewElement.getChild(0) as unknown as Text;
          const orgNameText = textNode.data.match(/\(([^)]+)\)/);
          return orgNameText ? orgNameText[1] : '';
        },
      },
    });

    // Register the command
    editor.commands.add('alightLinkUrlPluginCommand', new AlightLinkUrlPluginCommand(editor));
  }
}
