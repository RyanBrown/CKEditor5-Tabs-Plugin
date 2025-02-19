// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightNewDocumentLinkPluginUI from './alight-new-document-link-plugin-ui';

export default class AlightNewDocumentLinkPlugin extends Plugin {
  public static get requires() {
    return [AlightNewDocumentLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightNewDocumentLinkPlugin' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Listen for form submission events
    this.listenTo(editor.editing.view.document, 'newDocumentFormSubmit', (evt, data) => {
      // Handle the form submission data
      console.log('Form submitted with data:', data.detail.formData);
    });
  }
}