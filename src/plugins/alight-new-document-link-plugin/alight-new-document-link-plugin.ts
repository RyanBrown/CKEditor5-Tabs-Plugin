// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightNewDocumentLinkPluginCommand from './alight-new-document-link-plugin-command';
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

    // Register the command
    editor.commands.add(
      'alightNewDocumentLinkPlugin',
      new AlightNewDocumentLinkPluginCommand(editor)
    );

    // Listen for form submission events
    this.listenTo(editor.editing.view.document, 'newDocumentFormSubmit', (evt, data) => {
      // Handle the form submission data
      console.log('Form submitted with data:', data.detail);
      // You can add your custom handling logic here
    });
  }
}