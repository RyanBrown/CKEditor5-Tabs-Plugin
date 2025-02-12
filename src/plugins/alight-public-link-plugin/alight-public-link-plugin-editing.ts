// alight-public-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import { Element } from '@ckeditor/ckeditor5-engine';
import AlightPublicLinkPluginCommand from './alight-public-link-plugin-command';
import { safeGetAttribute } from './alight-public-link-plugin-utils';

export default class AlightPublicLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightPublicLinkPluginEditing' as const;
  }

  public static get requires() {
    return [Link] as const;
  }

  init(): void {
    const editor = this.editor;

    // Register the command
    editor.commands.add('alightPublicLinkPlugin', new AlightPublicLinkPluginCommand(editor));

    // Define schema
    editor.model.schema.extend('$text', {
      allowAttributes: ['displayText']
    });

    // Define conversion for displayText
    editor.conversion.for('downcast').attributeToElement({
      model: 'displayText',
      view: (value, conversionApi) => {
        const { writer } = conversionApi;

        // Skip conversion if no value
        if (!value) {
          return null;
        }

        const element = writer.createAttributeElement('span', {
          'data-display-text': value
        }, {
          priority: 5
        });

        return element;
      }
    });

    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        attributes: {
          'data-display-text': true
        }
      },
      model: {
        key: 'displayText',
        value: (viewElement: Element) => {
          if (!viewElement) return null;
          return viewElement.getAttribute('data-display-text') || null;
        }
      }
    });

    // Subscribe to link plugin's conversion
    this._setupLinkIntegration();
  }

  private _setupLinkIntegration(): void {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');

    // Update link command to handle our custom attributes
    if (linkCommand) {
      const originalExecute = linkCommand.execute;
      linkCommand.execute = (href: string) => {
        const selection = editor.model.document.selection;

        editor.model.change(writer => {
          // Execute original link command
          originalExecute.call(linkCommand, href);

          // If selection has displayText, update it
          if (selection.hasAttribute('displayText')) {
            const ranges = selection.getRanges();
            for (const range of ranges) {
              const displayText = selection.getAttribute('displayText');
              if (displayText) {
                writer.setAttribute('displayText', displayText, range);
              }
            }
          }
        });
      };
    }

    // Ensure our attribute is preserved when link is applied
    editor.conversion.for('downcast').add(dispatcher => {
      dispatcher.on('attribute:linkHref', (evt, data, conversionApi) => {
        const { item, attributeNewValue } = data;
        const { writer, mapper } = conversionApi;

        if (!attributeNewValue) {
          return;
        }

        const viewElement = mapper.toViewElement(item);
        if (!viewElement) {
          return;
        }

        const displayText = safeGetAttribute(item, 'displayText');
        if (displayText) {
          writer.setAttribute('data-display-text', displayText, viewElement);
        }
      }, { priority: 'low' });
    });
  }
}