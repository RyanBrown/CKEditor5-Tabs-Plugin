import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import AccordionCommand from '../accordion_plugin/accordioncommand';

export default class PopulationAccordion extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        const editor = this.editor;

        editor.model.schema.register('populationAccordion', {
            isObject: true,
            allowWhere: '$block',
            allowContentOf: '$block',
            allowAttributes: ['id', 'class'],
        });

        editor.conversion.for('upcast').elementToElement({
            model: 'populationAccordion',
            view: {
                name: 'populationSection',
                classes: 'custom-populationSection',
            },
        });

        editor.conversion.for('dataDowncast').elementToElement({
            model: 'populationAccordion',
            view: {
                name: 'populationSection',
                classes: 'custom-populationSection',
            },
        });

        editor.conversion.for('editingDowncast').elementToElement({
            model: 'populationAccordion',
            view: (modelElement, { writer: viewWriter }) => {
                const blockquote = viewWriter.createContainerElement('div', {
                    class: 'custom-populationSection',
                });
                return toWidget(blockquote, viewWriter, { label: 'populationSection' });
            },
        });

        editor.commands.add('insertPopulationAccordion', new InsertPopulationAccordionCommand(editor));

        editor.ui.componentFactory.add('insertPopulationAccordion', (locale) => {
            const view = new ButtonView(locale);
            view.set({
                label: 'Insert populationSection',
                withText: false,
                tooltip: false,
            });

            view.on('execute', () => {
                editor.execute('insertPopulationAccordion');
                editor.editing.view.focus();
            });

            return view;
        });
    }
}

class InsertPopulationAccordionCommand extends AccordionCommand {
    execute() {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            if (!sessionStorage.getItem('accordionPopulation')) return false;

            const populationSection = writer.createElement('populationAccordion', {
                class: 'custom-populationSection',
                id: `${Date.now()}`,
            });

            const populationName = sessionStorage.getItem('accordionPopulation');
            const populationId = sessionStorage.getItem('accordionPopulationId');
            const startPop = `[BEGIN ${populationName}]`;
            const endPop = `[END ${populationName}]`;

            const htmlContentStart = `<label contenteditable="true"><span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id="populationStart" populationid="${populationId}" data-haspopulation="custom-population" class="prevent-select">${startPop}</span></label>`;
            const htmlContentEnd = `<label contenteditable="true"><span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id="populationEnd" populationid="${populationId}" data-haspopulation="custom-population" class="prevent-select">${endPop}</span></label>`;

            const viewFragmentStart = this.editor.data.processor.toView(htmlContentStart);
            const modelFragmentStart = this.editor.data.toModel(viewFragmentStart);
            const viewFragmentEnd = this.editor.data.processor.toView(htmlContentEnd);
            const modelFragmentEnd = this.editor.data.toModel(viewFragmentEnd);

            writer.insert(modelFragmentEnd, populationSection);
            const defaultContent = this.insertAccordionElement(writer);
            writer.insert(defaultContent, populationSection);
            writer.insert(modelFragmentStart, populationSection);
            model.insertContent(populationSection, this.editor.model.document.selection);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'populationAccordion');
        this.isEnabled = allowedIn !== null;
    }

    insertAccordionElement(writer) {
        const accordion = writer.createElement('accordion');
        const button = writer.createElement('accordionButton');
        const title = writer.createElement('accordionTitle');
        const panel = writer.createElement('accordionPanel');

        writer.append(button, accordion);
        writer.append(title, accordion);
        writer.append(panel, accordion);

        const htmlTitle = this.editor.data.stringify(this.titleElement);
        const titleElement = this.editor.data.processor.toView(htmlTitle);
        const modelTitle = this.editor.data.toModel(titleElement);
        writer.insert(modelTitle, title);

        const htmlContent = this.editor.data.stringify(this.contentElement);
        const contentElement = this.editor.data.processor.toView(htmlContent);
        const modelContent = this.editor.data.toModel(contentElement);
        writer.insert(modelContent, panel);

        return accordion;
    }

    getExistingAccordion(writer) {
        const selection = this.editor.model.document.selection;
        this.selection = selection.getFirstPosition();
        const currentElementforSelection = selection.getFirstPosition()?.parent;
        const findCurrentAccordion = this.hasParentWithClass(currentElementforSelection, 'accordion');

        if (findCurrentAccordion !== 'false') {
            this.titleElement = this.getChildElementOfTag(findCurrentAccordion, 'accordionTitle');
            this.contentElement = this.getChildElementOfTag(findCurrentAccordion, 'accordionPanel');

            this.editor.model.change((writer) => {
                writer.remove(findCurrentAccordion);
            });
        }
    }

    hasParentWithClass(element, elementName) {
        if (element !== null) {
            let parent = element.parent;
            while (parent) {
                if (parent !== null && parent.name === elementName) {
                    return parent;
                }
                parent = parent.parent;
            }
            return 'false';
        }
        return 'false';
    }

    getChildElementOfTag(element, elementName) {
        if (element !== null) {
            const ElementsData = element._children._nodes;
            if (ElementsData !== undefined && ElementsData.length > 0) {
                for (let item of ElementsData) {
                    if (item.name === elementName) {
                        return item;
                    }
                }
            }
        }
    }
}
