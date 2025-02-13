// src/plugins/alight-public-link-plugin/alight-public-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { type Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkPluginCommand from './alight-public-link-plugin-command';

export default class AlightPublicLinkPluginEditing extends Plugin {
  // Define the plugin name for CKEditor
  public static get pluginName() {
    return 'AlightPublicLinkPluginEditing' as const;
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

    // Register the alightPublicLinkPlugin attribute
    schema.extend('$text', {
      allowAttributes: ['alightPublicLinkPlugin']
    });
  }

  // Define model-to-view and view-to-model conversion
  private _defineConverters(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Define conversion for downcasting (model to view)
    conversion.for('downcast').attributeToElement({
      model: {
        key: 'alightPublicLinkPlugin', // Model attribute key
        name: '$text' // Applied to text nodes
      },
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) return; // If no attribute value, return undefined

        const linkData = modelAttributeValue as { url: string; orgName?: string };
        const attributes: Record<string, string> = {
          href: linkData.url, // Set href attribute
          target: '_blank', // Open in a new tab
          rel: 'noopener noreferrer' // Security attributes
        };

        // Add orgName as data attribute if present
        if (linkData.orgName) {
          attributes['data-org-name'] = linkData.orgName;
        }

        return writer.createAttributeElement('a', attributes);
      }
    });

    // Define conversion for upcasting (view to model)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: true
        }
      },
      model: {
        key: 'alightPublicLinkPlugin', // Store the attribute in the model
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => {
          const href = viewElement.getAttribute('href');
          const orgName = viewElement.getAttribute('data-org-name');

          return {
            url: href,
            ...(orgName ? { orgName } : {})
          };
        }
      }
    });
  }

  // Define the command associated with the plugin
  private _defineCommands(): void {
    const editor = this.editor;
    editor.commands.add('alightPublicLinkPlugin', new AlightPublicLinkPluginCommand(editor));
  }
}
