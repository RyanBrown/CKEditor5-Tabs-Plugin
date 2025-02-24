// src/plugins/alight-email-link-plugin/alight-email-link-command.ts
import { Command, Editor } from '@ckeditor/ckeditor5-core';
import { OrganizationNameHandler } from './alight-email-link-plugin-utils';

export interface AlightEmailLinkPluginCommandOptions {
  email: string;
  orgName?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
  public orgNameHandler: OrganizationNameHandler;

  constructor(editor: Editor) {
    super(editor);
    this.orgNameHandler = new OrganizationNameHandler(editor);
  }

  override execute(options: AlightEmailLinkPluginCommandOptions): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const { email, orgName } = options;

    model.change(writer => {
      // First apply the email link to the current selection
      editor.execute('link', 'mailto:' + email);

      // Find the current selection range
      const range = selection.getFirstRange()!;
      const rangeEnd = range.end;

      // Remove any existing org name span
      this.orgNameHandler.removeOrgNameSpans(writer, range);

      // If org name is provided, add it after the link
      this.orgNameHandler.insertOrgName(writer, orgName || '', rangeEnd);
    });
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = this.editor.commands.get('link');

    // AlightEmailLinkPluginCommand should be enabled when the regular link command is enabled
    this.isEnabled = linkCommand ? linkCommand.isEnabled : false;
  }

  // Removes an email link and any associated organization name span
  public removeEmailLink(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const range = selection.getFirstRange()!;

    model.change(writer => {
      // First, remove the link
      editor.execute('unlink');

      // Then find and remove any org-name-text spans
      this.orgNameHandler.removeOrgNameSpans(writer, range);
    });
  }
}
