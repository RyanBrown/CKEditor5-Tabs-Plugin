// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-command.ts
import Command from '@ckeditor/ckeditor5-core/src/command';

/**
 * Command for the AlightNewDocumentLinkPlugin.
 * This is a simple command that's always enabled and doesn't actually modify content.
 * The actual document creation logic is handled by the UI component.
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
   * In this case, the command doesn't do anything as the actual logic 
   * is handled in the UI plugin's _showModal method.
   */
  override execute(): boolean {
    // The actual functionality is in the UI plugin's _showModal method
    return true;
  }

  /**
   * Refreshes the command's state.
   * This command is always enabled regardless of selection.
   */
  override refresh(): void {
    this.isEnabled = true;
  }
}