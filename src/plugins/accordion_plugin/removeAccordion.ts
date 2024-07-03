import Command from '@ckeditor/ckeditor5-core/src/command';

export default class RemoveAccordionCommand extends Command {
    private existingPopulationStartUce: any;
    private existingPopulationEndUce: any;
    private titleElement: any;
    private contentElement: any;

    override execute() {
        this.editor.model.change((writer: any) => {
            this.removeAccordion(writer);
        });
    }

    removeAccordion(writer: any) {
        const selection = this.editor.model.document.selection;
        const currentElement = selection.getFirstPosition()?.parent;
        const accordionElement = this.hasParentAccordion(currentElement, 'accordion');
        const populationAccordionElement = this.hasParentWithClass(
            accordionElement !== false ? accordionElement : currentElement,
            'custom-populationSection'
        );

        if (populationAccordionElement !== 'false' && populationAccordionElement !== 'uce') {
            const titleElement = this.getChildElementOfTag(populationAccordionElement, 'accordionTitle');
            const contentElement = this.getChildElementOfTag(populationAccordionElement, 'accordionPanel');
            writer.remove(populationAccordionElement);
        } else if (populationAccordionElement === 'uce') {
            writer.remove(this.existingPopulationStartUce);
            writer.remove(this.existingPopulationEndUce);
        }

        if (populationAccordionElement !== 'uce' && populationAccordionElement !== 'false') {
            const accordion = this.insertAccordionElement(writer);
            this.editor.model.insertContent(accordion, this.editor.model.document.selection.getFirstPosition());
        }
    }

    hasParentWithClass(element: any, className: string): any {
        while (element) {
            if (element.name === className) {
                return element;
            }
            element = element.parent;
        }
        return 'false';
    }

    getChildElementOfTag(element: any, tagName: string): any {
        if (!element || !element._children) return;

        for (const child of element._children._nodes) {
            if (child.name === tagName) {
                return child;
            }
        }
    }

    insertAccordionElement(writer: any): any {
        const accordion = writer.createElement('accordion');
        const button = writer.createElement('accordionButton');
        const title = writer.createElement('accordionTitle');
        const panel = writer.createElement('accordionPanel');

        writer.append(button, accordion);
        writer.append(title, accordion);
        writer.append(panel, accordion);

        writer.insert(this.convertElementToModel(writer, this.titleElement), title);
        writer.insert(this.convertElementToModel(writer, this.contentElement), panel);

        return accordion;
    }

    convertElementToModel(writer: any, element: any): any {
        const html = this.editor.data.stringify(element);
        const viewElement = this.editor.data.processor.toView(html);
        return this.editor.data.toModel(viewElement);
    }

    hasParentAccordion(element: any, elementName: string): any {
        while (element) {
            if (element.name === elementName) {
                return element;
            }
            element = element.parent;
        }
        return false;
    }
}
