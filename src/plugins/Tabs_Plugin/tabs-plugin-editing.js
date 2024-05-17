import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import { Widget } from '@ckeditor/ckeditor5-widget';
import { TabsPluginCommand, DeleteTabCommand, MoveTabCommand } from './tabs-plugin-command';

export default class TabsPluginEditing extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        const editor = this.editor;
        editor.commands.add('insertTab', new TabsPluginCommand(editor));
        editor.commands.add('deleteTab', new DeleteTabCommand(editor));
        editor.commands.add('moveTab', new MoveTabCommand(editor));

        this._defineSchema();
        this._defineConverters();
    }

    // Define the schema for the tabs plugin
    _defineSchema() {
        const schema = this.editor.model.schema;

        // Define schema for the tabs plugin and its child elements
        schema.register('tabsPlugin', {
            isObject: true,
            allowIn: '$root',
        });

        // Define schema for 'tabList' element
        schema.register('tabList', {
            isObject: true,
            allowIn: 'tabsPlugin',
            allowAttributes: ['class'],
        });

        // Define schema for 'tabListItem' element
        schema.register('tabListItem', {
            allowIn: 'tabList',
            allowContentOf: '$block',
            allowAttributes: ['class', 'data-target'],
        });

        // Define schema for 'tabTitle' element
        schema.register('tabTitle', {
            allowIn: 'tabListItem',
            allowContentOf: '$block',
            allowAttributes: ['class'],
        });

        // Define schema for 'tabContent' element
        schema.register('tabContent', {
            isObject: true,
            allowIn: 'tabsPlugin',
            allowAttributes: ['class'],
        });

        // Define schema for 'tabNestedContent' element
        schema.register('tabNestedContent', {
            allowIn: 'tabContent',
            allowAttributes: ['id', 'class', 'placeholder'],
            isObject: true,
            allowContentOf: '$block',
        });

        schema.register('tabEditBar', {
            isObject: true,
            allowIn: 'tabListItem',
            allowAttributes: ['class'],
        });

        // Define schema for 'moveButtonsWrapper' element
        schema.register('moveButtonsWrapper', {
            isObject: true,
            allowIn: 'tabEditBar',
            allowAttributes: ['class'],
        });

        // Define schema for 'moveLeftButton' element
        schema.register('moveLeftButton', {
            isObject: true,
            allowIn: 'moveButtonsWrapper',
            allowAttributes: ['class', 'title'],
            allowContentOf: [], // Disallow all content within the button
        });

        // Define schema for 'moveRightButton' element
        schema.register('moveRightButton', {
            isObject: true,
            allowIn: 'moveButtonsWrapper',
            allowAttributes: ['class', 'title'],
            allowContentOf: [],
        });

        // Define schema for 'deleteTabButton' element
        schema.register('deleteTabButton', {
            isObject: true,
            allowIn: 'tabEditBar',
            allowAttributes: ['class', 'title'],
        });

        // Define schema for 'addTabListItem' element
        schema.register('addTabListItem', {
            isObject: true,
            allowIn: 'tabList',
            allowAttributes: ['class'],
        });

        // Define schema for 'addTabButton' element
        schema.register('addTabButton', {
            isObject: true,
            allowIn: 'addTabListItem',
            allowAttributes: ['class', 'title'],
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Converters for 'tabsPlugin' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabs-plugin' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', { class: 'tabs-plugin' });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', { class: 'tabs-plugin' });
                return toWidget(div, viewWriter, { label: 'tabs plugin' });
            },
        });

        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab-list' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('ul', { class: 'tab-list' });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                const ul = viewWriter.createContainerElement('ul', { class: 'tab-list' });
                return toWidget(ul, viewWriter, { label: 'tab list' });
            },
        });

        // Conversion for 'tabListItem'
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'tab-list-item' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                return viewWriter.createContainerElement('li', {
                    class: classes ? `tab-list-item ${classes}` : 'tab-list-item',
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                const li = viewWriter.createContainerElement('li', {
                    class: classes ? `tab-list-item ${classes}` : 'tab-list-item',
                    'data-target': modelElement.getAttribute('data-target'),
                });
                return toWidget(li, viewWriter, { label: 'tab list item' });
            },
        });

        // Converters for 'tabEditBar' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tab-edit-bar',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tab-edit-bar',
                });
                return div;
            },
        });

        // Convert 'moveButtonsWrapper' element
        conversion.for('upcast').elementToElement({
            model: 'moveButtonsWrapper',
            view: { name: 'div', classes: 'move-buttons-wrapper' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'move-buttons-wrapper',
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'move-buttons-wrapper',
                }),
        });

        // Converters for 'moveLeftButton' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'button', classes: 'move-left-button' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-left-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Left'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-left-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Left'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'moveRightButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: { name: 'button', classes: 'move-right-button' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-right-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Right'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-right-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Right'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tab-title' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createEditableElement('div', { class: 'tab-title' });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createEditableElement('div', { class: 'tab-title' });
                return toWidgetEditable(div, viewWriter);
            },
        });

        // Converters for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'delete-tab-button',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Delete Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'delete-tab-button',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    isContentEditable: false, // Buttons shouldn't be editable
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Delete Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('li', {
                    class: 'add-tab-list-item',
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', {
                    class: 'add-tab-list-item',
                    isContentEditable: false,
                });
                return li;
            },
        });

        // Converters for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'add-tab-button',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Add Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'add-tab-button',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    isContentEditable: false, // Buttons shouldn't be editable
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Add Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'tab-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', { class: 'tab-content' });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', { class: 'tab-content' });
                return toWidget(div, viewWriter, { label: 'tab content' });
            },
        });

        // Converters for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'tab-nested-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                return viewWriter.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    placeholder: modelElement.getAttribute('placeholder'),
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                const div = viewWriter.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    placeholder: modelElement.getAttribute('placeholder'),
                });
                return toWidgetEditable(div, viewWriter);
            },
        });
    }
}
