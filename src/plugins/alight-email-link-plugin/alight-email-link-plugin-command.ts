// src/plugins/alight-email-link-plugin/alight-email-link-command.ts
import { Command } from '@ckeditor/ckeditor5-core';

export interface AlightEmailLinkPluginCommandOptions {
  email: string;
  orgName?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
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
      const items = Array.from(range.getItems());
      for (const item of items) {
        if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
          writer.remove(item);
        }
      }

      // If org name is provided, add it after the link
      if (orgName) {
        const spanElement = writer.createElement('span', { class: 'org-name-text' });
        writer.insertText(` (${orgName})`, spanElement);
        writer.insert(spanElement, rangeEnd);
      }
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
      const items = Array.from(range.getItems());
      for (const item of items) {
        if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
          writer.remove(item);
        }
      }
    });
  }
}
