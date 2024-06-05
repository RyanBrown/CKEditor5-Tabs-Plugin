import Command from '@ckeditor/ckeditor5-core/src/command';
import { insertAccordionElement } from './utils';

export default class AccordionCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            this.editor.model.insertContent(insertAccordionElement(writer));
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'accordion');

        this.isEnabled = allowedIn !== null;
    }
}
