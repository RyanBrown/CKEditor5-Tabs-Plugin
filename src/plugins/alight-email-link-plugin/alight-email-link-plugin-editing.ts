// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

export default class AlightEmailLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  public static get requires() {
    return [Link] as const;
  }

  public init(): void {
    this._defineSchema();
    this._defineConverters();
    this._defineCommands();
  }

  private _defineSchema(): void {
    this.editor.model.schema.extend('$text', {
      allowAttributes: ['alightEmailLinkPlugin']
    });
  }

  private _defineConverters(): void {
    const conversion = this.editor.conversion;

    // Downcast converter (model to view)
    conversion.for('downcast').attributeToElement({
      model: {
        key: 'alightEmailLinkPlugin',
        name: '$text'
      },
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) return;

        const linkData = modelAttributeValue as { email: string; orgName?: string };
        return writer.createAttributeElement('a', {
          href: `mailto:${linkData.email}`,
          'data-org-name': linkData.orgName || '',
          class: 'email-link'
        }, {
          priority: 5
        });
      }
    });

    // Upcast converter (view to model)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: /^mailto:/
        }
      },
      model: {
        key: 'alightEmailLinkPlugin',
        value: (viewElement: Element) => ({
          email: viewElement.getAttribute('href')?.replace(/^mailto:/, ''),
          orgName: viewElement.getAttribute('data-org-name')
        })
      }
    });
  }

  private _defineCommands(): void {
    this.editor.commands.add('alightEmailLinkPlugin', new AlightEmailLinkPluginCommand(this.editor));
  }
}
