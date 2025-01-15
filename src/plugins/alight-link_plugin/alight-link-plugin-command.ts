import { Command } from '@ckeditor/ckeditor5-core';
import { Writer } from '@ckeditor/ckeditor5-engine';

// Options for the AlightLinkCommand.
export interface LinkCommandOptions {
    href?: string;
    target?: string;
    rel?: string;
}

// The AlightLinkCommand class allows applying or removing link attributes in the model.
export default class AlightLinkCommand extends Command {
    // Executes the command to add or remove link attributes.
    // @param {LinkCommandOptions} options - The link attributes to apply or null to remove.
    public override execute(options: LinkCommandOptions): void {
        const { href, target, rel } = options;
        const model = this.editor.model;

        model.change((writer: Writer) => {
            const selection = model.document.selection;
            const range = selection.getFirstRange();

            if (range) {
                if (href) {
                    // Apply the link attributes.
                    writer.setAttribute('linkHref', href, range);
                    if (target) writer.setAttribute('linkTarget', target, range);
                    if (rel) writer.setAttribute('linkRel', rel, range);
                } else {
                    // Remove the link attributes.
                    ['linkHref', 'linkTarget', 'linkRel'].forEach((attr) => {
                        writer.removeAttribute(attr, range);
                    });
                }
            }
        });
    }

    // Refreshes the command state based on the current selection.
    public override refresh(): void {
        const model = this.editor.model;
        const selection = model.document.selection;

        this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;

        const href = selection.getAttribute('linkHref');
        const target = selection.getAttribute('linkTarget');
        const rel = selection.getAttribute('linkRel');

        // Set the command's value to reflect the current link attributes.
        this.value = href ? { href, target, rel } : null;
    }
}
