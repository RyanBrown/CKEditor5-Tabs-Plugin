import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Command, Plugin } from 'ckeditor5/src/core';

export default class RemovePopulationAccordion extends Plugin {
    static get requires() {
        return [RemovePopulationAccordionCommand];
    }

    init() {
        const editor = this.editor;

        // Add the removePopulationAccordion command to the editor
        editor.commands.add('removePopulationAccordion', new RemovePopulationAccordionCommand(editor));

        // Add a button to the UI to execute the removePopulationAccordion command
        editor.ui.componentFactory.add('removePopulationAccordion', (locale) => {
            const view = new ButtonView(locale);
            view.set({
                label: 'Remove Population Section',
                withText: true,
                tooltip: false,
            });

            // Bind the button click event to execute the command
            view.on('execute', () => {
                editor.execute('removePopulationAccordion');
                editor.editing.view.focus();
            });

            return view;
        });
    }
}

class RemovePopulationAccordionCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            this.removePopulationFormAccordion(writer);
        });
    }

    removePopulationFormAccordion(writer) {
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

    /**
     * Checks if an element has a parent with a specific class name.
     * @param {any} element - The element to check.
     * @param {string} className - The class name to search for.
     * @returns {any} - The parent element with the specified class name, or 'false' if not found.
     */
    hasParentWithClass(element, className) {
        while (element) {
            if (element.name === className) {
                return element;
            }
            element = element.parent;
        }
        return 'false';
    }

    /**
     * Retrieves a child element of a specific tag name from the given element.
     * @param {any} element - The element to search within.
     * @param {string} tagName - The tag name of the child element to find.
     * @returns {any} - The child element with the specified tag name.
     */
    getChildElementOfTag(element, tagName) {
        if (!element || !element._children) return;

        for (const child of element._children._nodes) {
            if (child.name === tagName) {
                return child;
            }
        }
    }

    /**
     * Inserts a new accordion element with given title and content elements.
     * @param {Writer} writer - The writer instance.
     * @param {any} titleElement - The title element.
     * @param {any} contentElement - The content element.
     * @returns {any} - The newly created accordion element.
     */
    insertAccordionElement(writer) {
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

    /**
     * Converts an element to a model element.
     * @param {Writer} writer - The writer instance.
     * @param {any} element - The element to convert.
     * @returns {any} - The converted model element.
     */
    convertElementToModel(writer, element) {
        const html = this.editor.data.stringify(element);
        const viewElement = this.editor.data.processor.toView(html);
        return this.editor.data.toModel(viewElement);
    }

    /**
     * Checks if an element has a parent accordion.
     * @param {any} element - The element to check.
     * @param {string} elementName - The name of the accordion element.
     * @returns {any} - The parent accordion element, or false if not found.
     */
    hasParentAccordion(element, elementName) {
        while (element) {
            if (element.name === elementName) {
                return element;
            }
            element = element.parent;
        }
        return false;
    }
}
