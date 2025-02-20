// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts

// Import necessary classes and plugins from CKEditor5.
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

// Define the main plugin class for editing email links.
export default class AlightEmailLinkPluginEditing extends Plugin {
  // Returns the plugin name.
  public static get pluginName() {
    // console.log('[AlightEmailLinkPluginEditing] Retrieving plugin name.');
    return 'AlightEmailLinkPluginEditing' as const;
  }

  // Returns the required plugins for this plugin.
  public static get requires() {
    // console.log('[AlightEmailLinkPluginEditing] Retrieving required plugins.');
    return [Link] as const;
  }

  // Initializes the plugin by defining schema, converters, and commands.
  public init(): void {
    // console.log('[AlightEmailLinkPluginEditing] Initializing plugin.');
    this._defineSchema();
    this._defineConverters();
    this._defineCommands();
    // console.log('[AlightEmailLinkPluginEditing] Plugin initialized successfully.');
  }

  // Extend the schema to allow the custom email link attribute on text nodes.
  private _defineSchema(): void {
    // console.log('[AlightEmailLinkPluginEditing] Defining schema.');
    this.editor.model.schema.extend('$text', {
      allowAttributes: ['alightEmailLinkPlugin']
    });
    // console.log('[AlightEmailLinkPluginEditing] Schema defined: allowed attribute "alightEmailLinkPlugin" on "$text".');
  }

  // Define conversion rules for downcasting (model to view) and upcasting (view to model).
  private _defineConverters(): void {
    // console.log('[AlightEmailLinkPluginEditing] Defining converters.');
    const conversion = this.editor.conversion;

    // Downcast converter: Converts the model attribute to a view element (an <a> tag).
    conversion.for('downcast').attributeToElement({
      model: {
        key: 'alightEmailLinkPlugin',
        name: '$text'
      },
      view: (modelAttributeValue, { writer }) => {
        // console.log('[AlightEmailLinkPluginEditing] Downcasting attribute "alightEmailLinkPlugin" with value:', modelAttributeValue);
        if (!modelAttributeValue) {
          // console.log('[AlightEmailLinkPluginEditing] No attribute value found during downcast. Skipping element creation.');
          return;
        }
        // Cast modelAttributeValue to an object containing email and optional orgName.
        const linkData = modelAttributeValue as { email: string; orgName?: string };
        // Create an anchor element with mailto link, data attribute, and a class.
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
          // Extract the email address by removing the 'mailto:' prefix.
          email: viewElement.getAttribute('href')?.replace(/^mailto:/, ''),
          orgName: viewElement.getAttribute('data-org-name')
        })
      }
    });
    // console.log('[AlightEmailLinkPluginEditing] Converters defined.');
  }

  // Define and add the command for handling email link attributes.
  private _defineCommands(): void {
    // console.log('[AlightEmailLinkPluginEditing] Defining commands.');
    // Add a new command instance to the editor under the key 'alightEmailLinkPlugin'.
    this.editor.commands.add('alightEmailLinkPlugin', new AlightEmailLinkPluginCommand(this.editor));
    // console.log('[AlightEmailLinkPluginEditing] Command "alightEmailLinkPlugin" added to the editor.');
  }
}
