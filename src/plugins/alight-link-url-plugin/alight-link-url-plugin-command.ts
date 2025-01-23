// alight-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { Writer } from '@ckeditor/ckeditor5-engine';

interface LinkCommandOptions {
  href?: string;
}

export default class AlightLinkUrlCommand extends Command {
  // Executes the command. - If an href is provided, the command sets the link attributes in the model range. If no href is provided, the command removes the link attributes.
  public override execute(options: LinkCommandOptions): void {
    const { href } = options;
    const editor = this.editor;
    const model = editor.model;

    model.change((writer: Writer) => {
      const selection = model.document.selection;
      const range = selection.getFirstRange();

      if (range) {
        if (href) {
          // Set or update the link attributes
          writer.setAttribute('linkHref', href, range);
        } else {
          // If 'href' is not present, remove all link attributes
          writer.removeAttribute('linkHref', range);
        }
      }
    });
  }

  // Refreshes the command state. - isEnabled: checks if there is a non-collapsed selection. value: stores the current link URL if the selection has a 'linkHref' attribute.
  public override refresh(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;

    // Optionally store additional attributes if desired:
    const href = selection.getAttribute('linkHref');

    // `value` can be an object with the current attributes
    this.value = href ? { href } : null;
  }
}
