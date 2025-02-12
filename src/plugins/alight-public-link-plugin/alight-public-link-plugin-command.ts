// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';

interface LinkCommandOptions {
  url: string;
  displayText?: string;
}

export default class AlightPublicLinkPluginCommand extends Command {
  override refresh(): void {
    // Enable command when there is a text selection
    const selection = this.editor.model.document.selection;
    this.isEnabled = !selection.isCollapsed;
  }

  override execute(options: LinkCommandOptions): void {
    const { url, displayText } = options;
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // Store the original selection for later use
      const ranges = Array.from(selection.getRanges());

      // Apply the link attribute to the selected text
      for (const range of ranges) {
        writer.setAttribute('linkHref', url, range);
        if (displayText) {
          writer.setAttribute('displayText', displayText, range);
        }
      }
    });
  }

  removeLink(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      const ranges = Array.from(selection.getRanges());
      for (const range of ranges) {
        writer.removeAttribute('linkHref', range);
        writer.removeAttribute('displayText', range);
      }
    });
  }

  // Get current link attributes for editing
  getCurrentLinkAttributes(): LinkCommandOptions | null {
    const selection = this.editor.model.document.selection;

    if (!selection) return null;

    return {
      url: selection.getAttribute('linkHref') as string || '',
      displayText: selection.getAttribute('displayText') as string || ''
    };
  }
}
