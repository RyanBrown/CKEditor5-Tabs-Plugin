import { Command } from '@ckeditor/ckeditor5-core';
import { Range, Writer } from '@ckeditor/ckeditor5-engine';

export default class AlightLinkCommand extends Command {
    override execute({ href }: { href: string }): void {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer: Writer) => {
            const selection = model.document.selection;
            const range = selection.getFirstRange();

            if (range && href) {
                writer.setAttribute('linkHref', href, range);
            } else if (range) {
                writer.removeAttribute('linkHref', range);
            }
        });
    }

    override refresh(): void {
        const editor = this.editor;
        const model = editor.model;
        const selection = model.document.selection;

        const isLink = selection.hasAttribute('linkHref');
        this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;
        this.value = isLink ? selection.getAttribute('linkHref') : null;
    }
}
