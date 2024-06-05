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
        });

        // Registering the button element used for toggling the accordion's visibility.
        schema.register('accordionButton', {
            allowIn: 'accordion',
        });
        // Registering the title element inside the accordion header.
        schema.register('accordionTitle', {
            allowIn: 'accordion',
            isLimit: true,
            allowContentOf: '$block',
        });
        // Registering the content panel of the accordion which can contain text or other elements.
        schema.register('accordionPanel', {
            allowIn: 'accordion',
            isLimit: true,
            allowContentOf: '$block',
        });
        // Extending the model to allow text and block elements inside the accordion panel.
        schema.extend('$text', { allowIn: 'accordionPanel' });
        schema.extend('$block', { allowIn: 'accordionPanel' });
        schema.extend('$clipboardHolder', { allowIn: 'accordionPanel' });

        // Adding a rule to prevent the accordion from being nested within itself.
        schema.addChildCheck((context, childDefinition) => {
            if (context.endsWith('accordionPanel') && childDefinition.name === 'accordion') {
                return false; // Disallow nesting accordions within other accordions.
            }
        });
    }

    // Defines the conversion rules for upcasting (view-to-model) and downcasting (model-to-view).
    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversions for accordion
        conversion.for('upcast').elementToElement({
            view: { name: 'table', classes: 'panelSection' },
            converterPriority: 'high',
            model: (viewElement, { writer: modelWriter }) => {
                const accordionElement = modelWriter.createElement('accordion', {
                    isOpen: viewElement.hasClass('open'),
                });

                return accordionElement;
            },
        });
        // Downcasting conversion for saving and editing: defines how model elements are represented in the view.
        conversion.for('downcast').elementToStructure({
            model: {
                name: 'accordion',
                attributes: ['isOpen'],
            },
            view: (modelElement, conversionApi) => {
                const { writer } = conversionApi;
                let isOpen = ' close';
                if (modelElement.hasAttribute('isOpen')) {
                    isOpen = modelElement.getAttribute('isOpen') == true ? ' open' : ' close';
                }

                const tableElement = writer.createContainerElement(
                    'table',
                    { class: 'panelSection ' + isOpen },
                    { renderUnsafeAttributes: ['isOpen'] }
                );
                writer.setAttribute('isOpen', isOpen, tableElement);
                const tbodyElement = writer.createContainerElement('tbody');

                //header tr
                const headSlot = writer.createSlot((node) => node.is('element', 'accordionTitle'));
                const buttonSlot = writer.createSlot((node) => node.is('element', 'accordionButton'));
                const buttonTd = writer.createContainerElement('td', { class: 'button-td' }, [buttonSlot]);
                const titleTd = writer.createContainerElement('td', { class: 'title-td' }, [headSlot]);
                const tableHead = writer.createContainerElement('tr', { class: 'tr-title' }, [buttonTd, titleTd]);

                //panel tr
                const tablePanelTd = writer.createEmptyElement('td');
                const panelSlot = writer.createSlot((node) => node.is('element', 'accordionPanel'));
                const tablePanel = writer.createContainerElement('tr', { class: 'tr-panel' }, [
                    tablePanelTd,
                    panelSlot,
                ]);

                writer.insert(writer.createPositionAt(tbodyElement, 0), tableHead);
                writer.insert(writer.createPositionAt(tbodyElement, 'end'), tablePanel);
                writer.insert(writer.createPositionAt(tableElement, 0), tbodyElement);

                return toWidget(tableElement, writer);
            },
        });

        // Conversions for accordion button
        conversion.for('upcast').elementToElement({
            model: 'accordionButton',
            view: { name: 'button', classes: 'aui-buttonitem-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'accordionButton',
            view: { name: 'button', classes: 'aui-buttonitem-content' },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'accordionButton',
            view: (modelElement, { writer }) => {
                // Prevent the mapper error
                if (!modelElement) {
                    console.error('accordionButton model element is undefined.');
                    return;
                }
                const button = writer.createEditableElement('button', {
                    class: 'aui-buttonitem-content',
                });
                // Make this editable and widgetized to be a functional part of the editor.
                return toWidget(button, writer, {
                    draggable: false,
                    keyboardFocusable: false,
                });
            },
        });

        // Conversions for accordion title
        conversion.for('upcast').elementToElement({
            model: 'accordionTitle',
            view: { name: 'span', classes: 'P_title' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'accordionTitle',
            view: { name: 'span', classes: 'P_title' },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'accordionTitle',
            view: (modelElement, { writer }) => {
                // Prevent the mapper error
                if (!modelElement) {
                    console.error("Model element for 'accordionTitle' is undefined.");
                    return;
                }
                const title = writer.createEditableElement('span', {
                    class: 'P_title',
                    'data-placeholder': PLACEHOLDER_TEXTS.TITLE,
                });
                // Make the panel editable and widgetized to be a functional part of the editor.
                return toWidgetEditable(title, writer, { draggable: false });
            },
        });

        // Conversions for accordion panel
        conversion.for('upcast').elementToElement({
            model: 'accordionPanel',
            view: {
                name: 'td',
                attributes: {
                    id: 'contentd1',
                },
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'accordionPanel',
            view: {
                name: 'td',
                attributes: {
                    id: 'contentd1',
                },
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'accordionPanel',
            view: (modelElement, { writer }) => {
                // Prevent the mapper error
                if (!modelElement) {
                    console.error("Model element for 'accordionPanel' is undefined.");
                    return;
                }
                const panel = writer.createEditableElement('td', {
                    id: 'contentd1',
                });
                // Make the panel editable and widgetized to be a functional part of the editor.
                return toWidgetEditable(panel, writer, { draggable: false });
            },
        });
    }

    // Registers event listeners to handle interactions in the editing view.
    _registerEventListenersForEditingView() {
        const editor = this.editor;

        // Listen for click events in the editing view
        editor.editing.view.document.on(
            'click',
            (evt, data) => {
                evt.stop();
                data.preventDefault();

                const viewElement = data.target;
                // Check if the clicked element is an accordion button

                if (viewElement.name === 'button') {
                    // Get the corresponding view element for the accordion
                    const accordionViewElement = viewElement.findAncestor('table');

                    // Get the corresponding model element for the accordion
                    const accordionModelElement = editor.editing.mapper.toModelElement(accordionViewElement);
                    if (accordionModelElement) {
                        // Toggle the "isOpen" attribute on the accordion model element
                        editor.model.change((writer) => {
                            let isOpen = false;
                            if (accordionModelElement.hasAttribute('isOpen')) {
                                isOpen = accordionModelElement.getAttribute('isOpen');
                            }

                            writer.setAttribute('isOpen', !isOpen, accordionModelElement);
                        });
                    }
                }
            },
            { priority: 'high' }
        );
    }
}
