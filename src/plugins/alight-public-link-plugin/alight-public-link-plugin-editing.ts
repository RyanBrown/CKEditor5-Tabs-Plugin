// src/plugins/alight-public-link-plugin/alight-public-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { type Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkCommand from './alight-public-link-plugin-command';

export default class AlightPublicLinkEditing extends Plugin {
  // Define the plugin name for CKEditor
  public static get pluginName() {
    return 'AlightPublicLinkEditing' as const;
  }

  // Declare dependencies for this plugin
  public static get requires() {
    return [Link];
  }

  // Initialize the plugin by defining converters and commands
  public init(): void {
    const editor = this.editor;
    this._defineConverters();
    this._defineCommands();
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

        // Create an <a> element with appropriate attributes
        return writer.createAttributeElement('a', {
          href: linkData.url, // Set href attribute
          target: '_blank', // Open in a new tab
          rel: 'noopener noreferrer' // Security attributes
        });
      }
    });

    // Define conversion for upcasting (view to model)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a', // Target <a> elements in the view
        attributes: {
          href: true // Ensure href attribute exists
        }
      },
      model: {
        key: 'alightPublicLinkPlugin', // Store the attribute in the model
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => ({
          url: viewElement.getAttribute('href'), // Extract the href attribute
          // The org name will be handled separately by the command
        })
      }
    });
  }

  // Define the command associated with the plugin
  private _defineCommands(): void {
    const editor = this.editor;
    editor.commands.add('alightPublicLinkPlugin', new AlightPublicLinkCommand(editor));
  }
}
