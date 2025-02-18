// src/plugins/alight-email-link-plugin/alight-email-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import AlightEmailLinkPluginUI from './alight-email-link-plugin-plugin-ui';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

// The `AlightEmailLinkPlugin` class is a CKEditor plugin that extends the default link functionality
// to support "public links" with additional attributes and UI elements.
export default class AlightEmailLinkPlugin extends Plugin {
  // Specifies the required plugins that this plugin depends on.
  // These plugins must be loaded for this plugin to function properly.
  public static get requires() {
    return [AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI, Link] as const;
  }

  // Defines the unique plugin name used to reference it within CKEditor.
  public static get pluginName() {
    return 'AlightEmailLinkPlugin' as const;
  }

  // Initializes the plugin when CKEditor loads it.
  // This method extends CKEditor's schema to allow a custom attribute (`alightEmailLinkPlugin`)
  // on text elements. This attribute is used to store additional information related to public links.
  public init(): void {
    const editor = this.editor;

    // Extend the model schema to allow the custom 'alightEmailLinkPlugin' attribute on text nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightEmailLinkPlugin']
    });
  }
}
