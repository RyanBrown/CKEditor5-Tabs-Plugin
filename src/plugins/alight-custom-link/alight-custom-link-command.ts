// src/plugins/alight-custom-link/alight-custom-link-command.ts
import Command from '@ckeditor/ckeditor5-core/src/command';
import type { Editor } from '@ckeditor/ckeditor5-core';

export default class AlightCustomLinkCommand extends Command {
  declare editor: Editor;

  // Executes the command.
  // If `options.value` is a string, it sets the custom link attribute to that value.
  // If `options.value` is null/empty, it removes the custom link attribute.
  public override execute(options: { value?: string | null }): void {
    const editor = this.editor;
    if (!editor) {
      return;
    }

    const model = editor.model;
    const document = model.document;
    const linkValue = options.value;

    model.change(writer => {
      if (linkValue) {
        writer.setSelectionAttribute('dataAlightLink', linkValue);
      } else {
        writer.removeSelectionAttribute('dataAlightLink');
      }
    });
  }

  // Refresh the command state.
  // The command is enabled only when there is a valid selection.
  public override refresh(): void {
    const editor = this.editor;
    this.isEnabled = editor ? !!editor.model.document.selection : false;

    if (this.isEnabled) {
      this.value = this.editor.model.document.selection.getAttribute('dataAlightLink');
    }
  }
}
