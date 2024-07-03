import Command from '@ckeditor/ckeditor5-core/src/command';
import { insertAccordionElement } from './utils';

export default class AccordionCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            const viewFragmentStart = this.editor.data.processor.toView(
                '<span style="display:none;" class="empty">space</span>'
            );
            const spanStartFragment = this.editor.data.toModel(viewFragmentStart);

            const accordion = insertAccordionElement(writer);
            this.editor.model.insertContent(accordion);
            this.editor.model.insertContent(spanStartFragment, this.editor.model.document.selection.getFirstPosition());
            writer.setSelection(accordion, 'on');
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'accordion');
        const parentElement = selection.getFirstPosition().parent;
        const notAllowed = parentElement.is('element') && parentElement.childCount > 0;

        this.isEnabled = !notAllowed && allowedIn !== null;
    }
}
