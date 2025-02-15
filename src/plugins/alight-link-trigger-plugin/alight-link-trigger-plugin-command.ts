// alight-link-trigger-plugin-command.ts

import { Command, Editor } from '@ckeditor/ckeditor5-core';

export default class AlightLinkTriggerCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  // The method that executes when the command is called.
  public override execute(): void {
    // Command logic, e.g. insert a link, open a dialog, etc.
    console.log('AlightLinkTriggerCommand executed!');
  }

  // Called automatically by CKEditor to refresh button states, etc.
  public override refresh(): void {
    // E.g., enable/disable based on editor state
    this.isEnabled = true;
  }
}
