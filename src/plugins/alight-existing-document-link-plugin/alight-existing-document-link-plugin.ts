// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightExistingDocumentLinkPluginEditing from './alight-existing-document-link-plugin-editing';
import AlightExistingDocumentLinkPluginUI from './alight-existing-document-link-plugin-ui';
import AlightExistingDocumentLinkPluginCommand from './alight-existing-document-link-plugin-command';

// The `AlightExistingDocumentLinkPlugin` class is a CKEditor plugin that extends the default link functionality
// to support "public links" with additional attributes and UI elements.
export default class AlightExistingDocumentLinkPlugin extends Plugin {
  // Specifies the required plugins that this plugin depends on.
  // These plugins must be loaded for this plugin to function properly.
  public static get requires() {
    return [AlightExistingDocumentLinkPluginEditing, AlightExistingDocumentLinkPluginUI, Link] as const;
  }

  // Defines the unique plugin name used to reference it within CKEditor.
  public static get pluginName() {
    return 'AlightExistingDocumentLinkPlugin' as const;
  }

  // Initializes the plugin when CKEditor loads it.
  // This method extends CKEditor's schema to allow a custom attribute (`alightExistingDocumentLinkPlugin`)
  // on text elements. This attribute is used to store additional information related to public links.
  public init(): void {
    const editor = this.editor;

    // Extend the model schema to allow the custom 'alightExistingDocumentLinkPlugin' attribute on text nodes.
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightExistingDocumentLinkPlugin']
    });
  }
}
