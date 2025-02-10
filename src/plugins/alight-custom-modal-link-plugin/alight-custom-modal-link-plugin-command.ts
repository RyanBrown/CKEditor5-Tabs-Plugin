// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';

export class AlightCustomModalLinkPluginCommand extends Command {
  public override execute(href: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (selection.isCollapsed) {
        const textNode = writer.createText(href, {
          customHref: href,  // Now using customHref instead of linkHref
          alightCustomModalLink: true
        });
        model.insertContent(textNode, selection.getFirstPosition()!);
      } else {
        const ranges = [...selection.getRanges()];
        for (const range of ranges) {
          writer.setAttribute('customHref', href, range);
          writer.setAttribute('alightCustomModalLink', true, range);
        }
      }
    });
  }

  public override refresh(): void {
    this.isEnabled = true;
  }
}
