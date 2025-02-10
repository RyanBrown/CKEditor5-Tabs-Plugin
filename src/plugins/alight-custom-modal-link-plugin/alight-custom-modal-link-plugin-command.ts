// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-command.ts

import { Command } from '@ckeditor/ckeditor5-core';

export class AlightCustomModalLinkPluginCommand extends Command {
  public override execute(href: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (selection.isCollapsed) {
        // If no text is selected, insert new linked text.
        const textNode = writer.createText(href, { linkHref: href });
        model.insertContent(textNode, selection.getFirstPosition()!);
      } else {
        // Turn the iterator into an array of Ranges
        const ranges = [...selection.getRanges()];
        // Set linkHref on each selected range
        for (const range of ranges) {
          writer.setAttribute('linkHref', href, range);
        }
      }
    });
  }

  public override refresh(): void {
    // If you have custom logic to enable/disable the command, put it here.
    this.isEnabled = true;
  }
}
