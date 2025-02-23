// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';

export default class AlightEmailLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  public static get requires() {
    return [Link] as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;
    const conversion = editor.conversion;

    // Allow span elements in the model
    schema.register('span', {
      allowWhere: '$text',
      allowContentOf: '$block',
      allowAttributes: ['class']
    });

    // Downcast conversion for spans
    conversion.for('downcast').elementToElement({
      model: 'span',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('span', {
          class: modelElement.getAttribute('class')
        });
      }
    });

    // Upcast conversion for spans
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['org-name-text']
      },
      model: (viewElement, { writer }) => {
        return writer.createElement('span', { class: 'org-name-text' });
      }
    });

    // Setup downcast conversion for email links
    conversion.for('downcast').attributeToElement({
      model: 'linkHref',
      view: (href, { writer }) => {
        if (!href) return;

        if (href.toLowerCase().startsWith('mailto:')) {
          return writer.createAttributeElement('a', {
            href,
            class: 'email-link'
          });
        }

        return writer.createAttributeElement('a', { href });
      }
    });

    // Setup upcast conversion for email links
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: /^mailto:/i
        }
      },
      model: {
        key: 'linkHref',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => viewElement.getAttribute('href')
      }
    });
  }
}