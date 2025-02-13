// src/plugins/alight-public-link-plugin/alight-public-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkPluginEditing from './alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from './alight-public-link-plugin-ui';
import AlightPublicLinkPluginCommand from './alight-public-link-plugin-command';

// The `AlightPublicLinkPlugin` class is a CKEditor plugin that extends the default link functionality
// to support "public links" with additional attributes and UI elements.
export default class AlightPublicLinkPlugin extends Plugin {
  // Specifies the required plugins that this plugin depends on.
  // These plugins must be loaded for this plugin to function properly.
  public static get requires() {
    return [AlightPublicLinkPluginEditing, AlightPublicLinkPluginUI, Link] as const;
  }

  // Defines the unique plugin name used to reference it within CKEditor.
  public static get pluginName() {
    return 'AlightPublicLinkPlugin' as const;
  }

  // Initializes the plugin when CKEditor loads it.
  // This method extends CKEditor's schema to allow a custom attribute (`alightPublicLinkPlugin`)
  // on text elements. This attribute is used to store additional information related to public links.
  public init(): void {
    const editor = this.editor;

    // Extend the model schema to allow the custom 'alightPublicLinkPlugin' attribute on text nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightPublicLinkPlugin']
    });
  }
}
