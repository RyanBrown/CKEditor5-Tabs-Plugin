// src/plugins/alight-generic-link-plugin/alight-generic-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightGenericLinkPluginEditing from './alight-generic-link-plugin-editing';
import AlightGenericLinkPluginUI from './alight-generic-link-plugin-ui';
import AlightGenericLinkPluginCommand from './alight-generic-link-plugin-command';

// The `AlightGenericLinkPlugin` class is a CKEditor plugin that extends the default link functionality
// to support "public links" with additional attributes and UI elements.
export default class AlightGenericLinkPlugin extends Plugin {
  // Specifies the required plugins that this plugin depends on.
  // These plugins must be loaded for this plugin to function properly.
  public static get requires() {
    return [AlightGenericLinkPluginEditing, AlightGenericLinkPluginUI, Link] as const;
  }

  // Defines the unique plugin name used to reference it within CKEditor.
  public static get pluginName() {
    return 'AlightGenericLinkPlugin' as const;
  }

  // Initializes the plugin when CKEditor loads it.
  // This method extends CKEditor's schema to allow a custom attribute (`alightGenericLinkPlugin`)
  // on text elements. This attribute is used to store additional information related to public links.
  public init(): void {
    const editor = this.editor;

    // Extend the model schema to allow the custom 'alightGenericLinkPlugin' attribute on text nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightGenericLinkPlugin']
    });
  }
}
