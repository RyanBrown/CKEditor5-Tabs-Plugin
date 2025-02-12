// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { Editor } from '@ckeditor/ckeditor5-core';
interface LinkCommandOptions {
  url: string;
  displayText?: string;
}

export default class AlightPublicLinkPluginCommand extends Command {
  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = this.editor.commands.get('link');

    // Safe check for linkCommand existence
    this.isEnabled = linkCommand ? linkCommand.isEnabled : false;
  }

  override execute(options: LinkCommandOptions): void {
    const { url, displayText } = options;
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    if (!selection) return;

    const ranges = Array.from(selection.getRanges());
    if (!ranges.length) return;

    model.change(writer => {
      for (const range of ranges) {
        if (!range.start.parent) continue;

        writer.setAttribute('linkHref', url, range);
        if (displayText) {
          writer.setAttribute('displayText', displayText, range);
        }
      }
    });
  }

  // Method to remove link and custom attributes
  removeLink(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const ranges = selection.getRanges();

    model.change(writer => {
      for (const range of ranges) {
        writer.removeAttribute('linkHref', range);
        writer.removeAttribute('displayText', range);
      }
    });
  }
}
