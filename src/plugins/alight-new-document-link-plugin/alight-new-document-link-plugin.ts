// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightNewDocumentLinkPluginEditing from './alight-new-document-link-plugin-editing';
import AlightNewDocumentLinkPluginUI from './alight-new-document-link-plugin-ui';
import AlightNewDocumentLinkPluginCommand from './alight-new-document-link-plugin-command';

// The `AlightNewDocumentLinkPlugin` class is a CKEditor plugin that extends the default link functionality
// to support "public links" with additional attributes and UI elements.
export default class AlightNewDocumentLinkPlugin extends Plugin {
  // Specifies the required plugins that this plugin depends on.
  // These plugins must be loaded for this plugin to function properly.
  public static get requires() {
    return [AlightNewDocumentLinkPluginEditing, AlightNewDocumentLinkPluginUI, Link] as const;
  }

  // Defines the unique plugin name used to reference it within CKEditor.
  public static get pluginName() {
    return 'AlightNewDocumentLinkPlugin' as const;
  }

  // Initializes the plugin when CKEditor loads it.
  // This method extends CKEditor's schema to allow a custom attribute (`alightNewDocumentLinkPlugin`)
  // on text elements. This attribute is used to store additional information related to public links.
  public init(): void {
    const editor = this.editor;

    // Extend the model schema to allow the custom 'alightNewDocumentLinkPlugin' attribute on text nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightNewDocumentLinkPlugin']
    });
  }
}
