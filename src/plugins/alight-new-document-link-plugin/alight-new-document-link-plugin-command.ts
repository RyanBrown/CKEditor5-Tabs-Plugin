// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-command.ts
import Command from '@ckeditor/ckeditor5-core/src/command';
import AlightNewDocumentLinkPluginUI from './alight-new-document-link-plugin-ui';

/**
 * Command for the AlightNewDocumentLinkPlugin.
 * Handles opening the modal dialog for creating new documents.
 */
export default class AlightNewDocumentLinkPluginCommand extends Command {
  /**
   * Creates an instance of the command.
   * @param editor The editor instance.
   */
  constructor(editor: any) {
    super(editor);

    // This command is always enabled
    this.isEnabled = true;
  }

  /**
   * Executes the command.
   * Gets the UI plugin instance and calls its _showModal method.
   */
  override execute(initialValue?: { url?: string; orgName?: string; email?: string }): void {
    // Get the UI plugin instance
    const uiPlugin = this.editor.plugins.get(AlightNewDocumentLinkPluginUI);

    // Show the modal with any provided initial values
    uiPlugin._showModal(initialValue);
  }

  /**
   * Refreshes the command's state.
   * This command is always enabled regardless of selection.
   */
  override refresh(): void {
    this.isEnabled = true;
  }
}