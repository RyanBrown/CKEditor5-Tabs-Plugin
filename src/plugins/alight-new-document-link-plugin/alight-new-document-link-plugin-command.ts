// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';

export default class AlightNewDocumentLinkPluginCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  override refresh(): void {
    // Command is always enabled
    this.isEnabled = true;
  }

  override execute(): void {
    // Command execution is now just a trigger for opening the modal
    // Actual form handling is done in the UI component
  }
}