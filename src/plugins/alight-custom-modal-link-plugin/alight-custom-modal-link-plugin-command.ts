// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-command.ts

import { Command } from '@ckeditor/ckeditor5-core';

export class AlightCustomModalLinkPluginCommand extends Command {
  public override execute(href: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (selection.isCollapsed) {
        const textNode = writer.createText(href, {
          linkHref: href,
          alightCustomModalLink: true  // Add custom attribute
        });
        model.insertContent(textNode, selection.getFirstPosition()!);
      } else {
        const ranges = [...selection.getRanges()];
        for (const range of ranges) {
          writer.setAttribute('linkHref', href, range);
          writer.setAttribute('alightCustomModalLink', true, range);  // Add custom attribute
        }
      }
    });
  }

  public override refresh(): void {
    this.isEnabled = true;
  }
}