// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { type Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

export default class AlightEmailLinkPluginEditing extends Plugin {
  // Define the plugin name for CKEditor
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  // Declare dependencies for this plugin
  public static get requires() {
    return [Link];
  }

  // Initialize the plugin by defining converters and commands
  public init(): void {
    const editor = this.editor;
    this._defineSchema();
    this._defineConverters();
    this._defineCommands();
  }

  // Define the schema for the plugin
  private _defineSchema(): void {
    const schema = this.editor.model.schema;

    // Register the alightEmailLinkPlugin attribute
    schema.extend('$text', {
      allowAttributes: ['alightEmailLinkPlugin']
    });
  }

  // Define model-to-view and view-to-model conversion
  private _defineConverters(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Define conversion for downcasting (model to view)
    conversion.for('downcast').attributeToElement({
      model: {
        key: 'alightEmailLinkPlugin', // Model attribute key
        name: '$text' // Applied to text nodes
      },
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) return; // If no attribute value, return undefined

        const linkData = modelAttributeValue as { url: string; orgName?: string };
        const linkElement = writer.createAttributeElement('a', {
          href: linkData.url, // Set href attribute
          target: '_blank', // Open in a new tab
          rel: 'noopener noreferrer', // Security attributes
          ...(linkData.orgName ? { 'data-org-name': linkData.orgName } : {})
        }, {
          priority: 5
        });

        return linkElement;
      }
    });

    // Upcast converter (view to model)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: true
        }
      },
      model: {
        key: 'alightEmailLinkPlugin',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => ({
          url: viewElement.getAttribute('href'),
          orgName: viewElement.getAttribute('data-org-name')
        })
      }
    });
  }

  // Define the command associated with the plugin
  private _defineCommands(): void {
    const editor = this.editor;
    editor.commands.add('alightEmailLinkPlugin', new AlightEmailLinkPluginCommand(editor));
  }
}
