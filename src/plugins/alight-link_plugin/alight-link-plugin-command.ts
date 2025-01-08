import { Command } from '@ckeditor/ckeditor5-core';
import { Writer } from '@ckeditor/ckeditor5-engine';

// The command that manages link creation and removal in the editor model.
export default class AlightLinkCommand extends Command {
    /**
     * Executes the command.
     * If an href is provided, the command sets the 'linkHref' attribute in the model range.
     * If no href is provided, the command removes the 'linkHref' attribute from the selection range.
     */
    override execute({ href }: { href: string }): void {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer: Writer) => {
            const selection = model.document.selection;
            const range = selection.getFirstRange();

            if (range && href) {
                // If 'href' is present, set the 'linkHref' attribute in the model range
                writer.setAttribute('linkHref', href, range);
            } else if (range) {
                // If 'href' is not present, remove the 'linkHref' attribute (unlinks)
                writer.removeAttribute('linkHref', range);
            }
        });
    }

    /**
     * Refreshes the command state.
     * - isEnabled: checks if there is a non-collapsed selection.
     * - value: stores the current link URL if the selection has a 'linkHref' attribute.
     */
    override refresh(): void {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;

        const isLink = selection.hasAttribute('linkHref');
        this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;
        this.value = isLink ? selection.getAttribute('linkHref') : null;
    }
}
