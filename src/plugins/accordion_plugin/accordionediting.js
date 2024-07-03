import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget, toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import AccordionCommand from './accordioncommand';
import { PLACEHOLDER_TEXTS, toggleAccordionOpenState } from './utils';

export default class AccordionEditing extends Plugin {
    // Specifies the dependencies needed by this plugin, specifically the Widget plugin.
    static get requires() {
        return [Widget];
    }

    // Initialization function for setting up the plugin's schema and converters.
    init() {
        const editor = this.editor;
        editor.commands.add('insertAccordion', new AccordionCommand(editor));
        this._defineSchema();
        this._defineConverters();
        this._registerEventListenersForEditingView();
    }

    // Defines the schema for the custom accordion elements.
    _defineSchema() {
        const schema = this.editor.model.schema;

        // Registering the main accordion container element.
        schema.register('accordion', {
            inheritAllFrom: '$blockObject',
            isLimit: true,
            allowAttributes: ['isOpen'],
            allowIn: ['populationAccordion', 'ah:expr'],
        });

        // Registering the button element used for toggling the accordion's visibility.
        schema.register('accordionButton', {
            allowIn: 'accordion',
        });
        // Registering the title element inside the accordion header.
        schema.register('accordionTitle', {
            allowIn: 'accordion',
            isLimit: true,
            allowChildren: '$text',
            isInline: true,
        });
        // Registering the content panel of the accordion which can contain text or other elements.
        schema.register('accordionPanel', {
            allowIn: 'accordion',
            allowContentOf: '$container',
            isLimit: true,
            isSelectable: true,
            allowAttributes: ['id'],
        });

        // Adding a rule to prevent the accordion from being nested within itself.
        schema.addChildCheck((context, childDefinition) => {
            if (context.endsWith('accordionPanel') && childDefinition.name === 'accordion') {
                return false;
            }
            if (context.endsWith('accordionTitle') && childDefinition.name !== '$text') {
                return false;
            }
        });

        schema.addAttributeCheck((context, attributeName) => {
            if (context.endsWith('accordionTitle $text') && attributeName !== 'bold') {
                return false;
            }
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for('upcast').elementToElement({
            view: { name: 'table', classes: 'panelSection' },
            converterPriority: 'high',
            model: (viewElement, { writer: modelWriter }) => {
                return modelWriter.createElement('accordion', {
                    isOpen: viewElement.hasClass('open'),
                });
            },
        });

        const createAccordionView = (modelElement, conversion, isDataDowncast) => {
            const writer = conversion.writer;
            const isOpen = modelElement.getAttribute('isOpen') ? ' open' : ' close';
            const panelContent = modelElement.getAttribute('isOpen') ? 'show' : 'hide';

            const tableElement = writer.createContainerElement('table', { class: `panelSection ${isOpen}` });
            writer.setAttribute('isOpen', isOpen, tableElement);
            const tbodyElement = writer.createContainerElement('tbody');

            //header tr
            const headSlot = writer.createSlot((node) => node.is('element', 'accordionTitle'));
            const buttonSlot = writer.createSlot((node) => node.is('element', 'accordionButton'));
            const buttonTd = writer.createContainerElement('td', { class: 'button-td' }, [buttonSlot]);
            const titleTd = writer.createContainerElement('td', { class: 'title-td' }, [headSlot]);
            const tableHead = writer.createContainerElement('tr', { class: 'tr-title' }, [buttonTd, titleTd]);

            // panel tr
            const tablePanelTd = writer.createEmptyElement('td');
            const panelSlot = writer.createSlot((node) => node.is('element', 'accordionPanel'));
            const tablePanel = writer.createContainerElement('tr', { class: tablePanelClass }, [
                tablePanelTd,
                panelSlot,
            ]);

            writer.insert(writer.createPositionAt(tbodyElement, 0), tableHead);
            writer.insert(writer.createPositionAt(tbodyElement, 'end'), tablePanel);
            writer.insert(writer.createPositionAt(tableElement, 0), tbodyElement);

            return toWidget(tableElement, writer);
        };

        conversion.for('dataDowncast').elementToStructure({
            model: { name: 'accordion', attributes: ['isOpen'] },
            view: (modelElement, conversionApi) => createAccordionView(modelElement, conversionApi, true),
        });

        conversion.for('editingDowncast').elementToStructure({
            model: { name: 'accordion', attributes: ['isOpen'] },
            view: (modelElement, conversionApi) => createAccordionView(modelElement, conversionApi, false),
        });

        conversion.for('upcast').elementToElement({
            view: { name: 'button', classes: 'aui-buttonitem-content' },
            model: (viewElement, conversionApi) => {
                const modelWriter = conversionApi.writer;
                return modelWriter.createElement('accordionButton', { id: viewElement.getAttribute('id') });
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'accordionButton',
            view: (modelElement, conversion) => {
                const writer = conversion.writer;
                const buttonId = modelElement.getAttribute('id') ?? `btnpanel-icon${Date.now()}`;
                return writer.createContainerElement(
                    'button',
                    {
                        class: 'aui-buttonitem-content',
                        id: buttonId,
                        onclick: `javascript:if (typeof panelOnClick ==='function') eval(panelOnClick('${buttonId}'));`,
                    },
                    [
                        writer.createEmptyElement(
                            'span',
                            {
                                class: 'pmicon plusIco',
                                style: 'display: inline-block;vertical-align: middle;padding: 6px 6px;cursor: pointer;',
                            },
                            { renderUnsafeAttributes: ['onclick', 'style'] }
                        ),
                    ]
                );
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'accordionButton',
            view: (modelElement, { writer }) => {
                const button = writer.createEditableElement('button', { class: 'aui-buttonitem-content' });
                return toWidget(button, writer, { draggable: false, keyboardFocusable: false });
            },
        });

        conversion.for('upcast').elementToElement({
            model: 'accordionTitle',
            view: { name: 'span', classes: 'P_title' },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'accordionTitle',
            view: { name: 'span', classes: 'P_title dark m fwb' },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'accordionTitle',
            view: (modelElement, { writer }) => {
                const title = writer.createEditableElement('span', { class: 'P_title dark m fwb' });
                return toWidgetEditable(title, writer, { draggable: false });
            },
        });

        conversion.for('upcast').elementToElement({
            model: 'accordionPanel',
            view: { name: 'div', classes: 'panel_content_hide' },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'accordionPanel',
            view: { name: 'div', classes: 'panel_content_show' },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'accordionPanel',
            view: (modelElement, { writer }) => {
                const panel = writer.createEditableElement('div', { class: 'panel_content_show' });
                return toWidgetEditable(panel, writer, { draggable: false });
            },
        });
    }

    _registerEventListenersForEditingView() {
        // Register any required event listeners for the editing view here
    }
}
