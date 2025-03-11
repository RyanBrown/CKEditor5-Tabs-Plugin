// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightNewDocumentLinkPluginUI from './alight-new-document-link-plugin-ui';
import AlightNewDocumentLinkPluginCommand from './alight-new-document-link-plugin-command';

export default class AlightNewDocumentLinkPlugin extends Plugin {
  public static get requires() {
    return [AlightNewDocumentLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightNewDocumentLinkPlugin' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Register the command for the new document link plugin
    editor.commands.add('alightNewDocumentLinkPlugin', new AlightNewDocumentLinkPluginCommand(editor));

    // Get UI plugin instance to access it elsewhere if needed
    const uiPlugin = editor.plugins.get(AlightNewDocumentLinkPluginUI);

    // Listen for document creation events (fired from the UI plugin)
    this.listenTo(editor.editing.view.document, 'newDocumentCreated', (evt, data) => {
      if (!data) return;

      console.log('New document created:', data);

      // You can perform additional actions here,
      // like inserting a link to the newly created document
      if (data.documentUrl && data.documentTitle) {
        this.insertLinkToNewDocument(data.documentUrl, data.documentTitle);
      }
    });

    // Listen for modal closed event
    this.listenTo(uiPlugin, 'modalClosed', () => {
      console.log('Document creation modal was closed');
    });
  }

  /**
   * Inserts a link to the newly created document at the current selection position
   * 
   * @param url The URL of the created document
   * @param title The title to use for the link text
   */
  private insertLinkToNewDocument(url: string, title: string): void {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    // Only insert if we have a valid selection position
    if (selection && !selection.isCollapsed) {
      // Get the link command
      const linkCommand = editor.commands.get('link');

      if (linkCommand && linkCommand.isEnabled) {
        // Execute the link command to insert a link
        editor.execute('link', url, {
          linkIsExternal: true,
          linkIsDownloadable: false
        });
      }
    } else {
      // Insert link at current position if there's no selection
      editor.model.change(writer => {
        const linkText = writer.createText(title, { linkHref: url });
        editor.model.insertContent(linkText);
      });
    }
  }
}
