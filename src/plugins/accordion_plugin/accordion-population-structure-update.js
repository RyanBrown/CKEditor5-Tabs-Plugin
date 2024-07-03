import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import AccordionCommand from '../accordion_plugin/accordioncommand';

export default class PopulationAccordionUpdateStructure extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        const editor = this.editor;

        // Register the blockquote element in the schema
        editor.model.schema.register('ah:expr', {
            isObject: true,
            allowWhere: '$block',
            allowContentOf: ['$block', '$text', '$blockObject'],
            allowAttributes: ['id', 'class', 'assettype'],
            renderUnsafeAttributes: ['assettype'],
        });

        // Define upcast converter
        editor.conversion.for('upcast').elementToElement({
            model: 'ah:expr',
            view: {
                name: 'populationAccordion',
                classes: 'custom-populationSection exprSelector selectorTag',
            },
        });

        // Define data downcast converter
        editor.conversion.for('dataDowncast').elementToElement({
            model: 'ah:expr',
            view: {
                name: 'populationAccordion',
                classes: 'custom-populationSection exprSelector selectorTag',
            },
        });

        // Define editing downcast converter
        editor.conversion.for('editingDowncast').elementToElement({
            model: 'ah:expr',
            view: (modelElement, { writer: viewWriter }) => {
                const blockquote = viewWriter.createContainerElement('div', {
                    class: 'custom-populationSection exprSelector selectorTag',
                    renderUnsafeAttributes: 'assettype',
                });
                return toWidget(blockquote, viewWriter, { label: 'ah:expr' });
            },
        });

        // Add the command to insert a populationSection
        editor.commands.add('insertPopulationUpdateAccordion', new InsertPopulationAccordionUpdateCommand(editor));

        // Add a button to the toolbar to execute the command
        editor.ui.componentFactory.add('insertPopulationUpdateAccordion', (locale) => {
            const view = new ButtonView(locale);

            view.set({
                label: 'Insert populationSection Update',
                withText: true,
                tooltip: false,
            });

            view.on('execute', () => {
                editor.execute('insertPopulationUpdateAccordion');
                editor.editing.view.focus();
            });

            return view;
        });
    }
}

class InsertPopulationAccordionUpdateCommand extends AccordionCommand {
    execute() {
        const editor = this.editor;
        const model = editor.model;
        const timeStampId = `${Date.now()}`;
        model.change((writer) => {
            // getting data from the existing accordion
            const data = this.getExistingAccordion(writer);
            // Create the blockquote element
            if (
                sessionStorage.getItem('accordionPopulation') === undefined ||
                sessionStorage.getItem('accordionPopulation') === ''
            ) {
                return false;
            }
            const populationSection = writer.createElement('ah:expr', {
                class: 'custom-populationSection exprSelector selectorTag',
                id: timeStampId,
                renderUnsafeAttributes: 'assettype',
            });
            const populationName = sessionStorage.getItem('accordionPopulation');
            const populationId = timeStampId; // sessionStorage.getItem("accordionPopulationId");
            //const htmlContentStart = `<span style="color:green" class="html-content">BEGIN_${populationName}</span>`;
            //const htmlContentEnd = `<span style="color:green" class="html-content">END_${populationName}</span>`;
            let startPop = `[BEGIN ${populationName}]`;
            let endPop = `[END ${populationName}]`;

            let htmlContentStart =
                '<label contenteditable="true"><span class="hide-in-awl p-hidden" style ="color: green;" contenteditable="false" id ="populationStart" populationid ="' +
                populationId +
                '" data-haspopulation = "custom-population"  class="prevent-select">' +
                startPop +
                ' </span></label>';
            let htmlContentEnd =
                '<label contenteditable="true"><span class="hide-in-awl p-hidden" style="color: green;" contenteditable="false" id ="populationEnd" populationid ="' +
                populationId +
                '" data-haspopulation = "custom-population"  class="prevent-select">' +
                endPop +
                '</span></label>';

            const viewFragmentStart = this.editor.data.processor.toView(htmlContentStart);
            const modelFragmentStart = this.editor.data.toModel(viewFragmentStart);

            const viewFragmentEnd = this.editor.data.processor.toView(htmlContentEnd);
            const modelFragmentEnd = this.editor.data.toModel(viewFragmentEnd);

            writer.insert(modelFragmentEnd, populationSection);

            const defaultContent = this.insertAccordionElement(writer);
            writer.insert(defaultContent, populationSection);
            writer.insert(modelFragmentStart, populationSection);
            // Insert the blockquote at the current selection
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

        // Build the nested structure
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
    titleElement;
    contentElement;
    getExistingAccordion(writer) {
        const selection = this.editor.model.document.selection;
        this.selection = selection.getFirstPosition();
        const currentElementforSelection = selection.getFirstPosition()?.parent;
        const findCurrentAccordion = this.hasParentWithClass(currentElementforSelection, 'accordion');
        /*  remove the current accordion */
        if (findCurrentAccordion !== 'false') {
            this.titleElement = this.getChildElementOfTag(findCurrentAccordion, 'accordionTitle');
            this.contentElement = this.getChildElementOfTag(findCurrentAccordion, 'accordionPanel');

            let nodes = this.contentElement._children._nodes;
            this.editor.model.change((writer) => {
                writer.remove(findCurrentAccordion);
            });
        }

        // const modelFragment = this.generateFragmentData(this.titleElement, this.contentElement);
        // this.editor.model.insertContent(modelFragment, this.editor.model.document.selection.getFirstPosition());
        // return modelFragment;
    }
    htmlTitle;
    htmlContent;
    generateFragmentData(contentTitle, contentElement) {
        const titleFragment = this.editor.data.toView(contentTitle);
        this.htmlTitle = this.editor.data.processor.toData(titleFragment);

        const ContentFragment = this.editor.data.toView(contentElement);
        this.htmlContent = this.editor.data.processor.toData(ContentFragment);
    }
    hasParentWithClass(element, elementName) {
        if (element !== null) {
            let parent = element.parent;
            while (parent) {
                if (parent !== null && parent !== undefined && parent.name === elementName) {
                    return parent;
                }
                parent = parent.parent;
                this.hasParentWithClass(parent, elementName);
            }
            return 'false';
        } else {
            return 'false';
        }
    }

    getChildElementOfTag(element, elementName) {
        if (element !== null && element !== undefined) {
            let ElementsData = element._children._nodes;
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
