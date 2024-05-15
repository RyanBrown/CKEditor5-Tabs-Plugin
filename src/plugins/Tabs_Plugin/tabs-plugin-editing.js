import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import { Widget } from '@ckeditor/ckeditor5-widget';
import { TabsPluginCommand, RemoveTabCommand, MoveTabCommand } from './tabs-plugin-command';

export default class TabsPluginEditing extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        const editor = this.editor;
        editor.commands.add('insertTab', new TabsPluginCommand(editor));
        editor.commands.add('removeTab', new RemoveTabCommand(editor));
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
            allowContentOf: '$text', // Allows text directly inside the element
            allowAttributes: ['class', 'data-target'],
        });

        // Define schema for 'tabEditBar' element
        schema.register('tabEditBar', {
            isObject: true,
            allowIn: 'tabListItem',
            allowAttributes: ['class'],
        });

        // Define schema for 'moveLeftButton' element
        schema.register('moveLeftButton', {
            isObject: true,
            allowIn: 'tabEditBar',
            allowAttributes: ['class', 'title'],
        });

        // Define schema for 'moveRightButton' element
        schema.register('moveRightButton', {
            isObject: true,
            allowIn: 'tabEditBar',
            allowAttributes: ['class', 'title'],
        });

        // Define schema for 'tabTitleEditBar' element
        schema.register('tabTitleEditBar', {
            isObject: true,
            allowIn: 'tabListItem',
            allowAttributes: ['class'],
        });

        // Define schema for 'tabTitle' element
        schema.register('tabTitle', {
            allowWhere: '$text', // Allows the element to be where text can be
            isInline: true, // It's an inline element
            allowContentOf: '$block', // Allows block content, you might adjust this depending on needs
            allowAttributes: ['class', 'id'], // Optional: Allow additional attributes if needed
        });

        // Define schema for 'removeTabButton' element
        schema.register('removeTabButton', {
            isObject: true,
            allowIn: 'tabTitleEditBar',
            isBlock: true,
            allowAttributes: ['class', 'title'],
        });

        // Define schema for 'addTabListItem' element
        schema.register('addTabListItem', {
            isObject: true,
            allowIn: 'tabList',
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
            allowAttributes: ['id', 'class'],
            isObject: true,
            allowContentOf: '$block',
            isLimit: true,
        });

        // Define schema for 'tabNestedContentTitle' element
        schema.register('tabNestedContentTitle', {
            allowIn: 'tabNestedContent',
            isLimit: true,
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Converters for 'tabsPlugin' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: {
                name: 'div',
                classes: 'tabs-plugin',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tabs-plugin',
                    isContentEditable: false,
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabs-plugin',
                });
                return toWidget(div, viewWriter, {
                    label: 'tabs container',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'tabList' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: {
                name: 'ul',
                classes: 'tab-list',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('ul', {
                    class: 'tab-list',
                    isContentEditable: false,
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                const ul = viewWriter.createContainerElement('ul', {
                    class: 'tab-list',
                });
                return toWidget(ul, viewWriter, {
                    label: 'tab list',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Conversion for 'tabListItem'
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: {
                name: 'li',
                classes: 'tab-list-item',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('li', {
                    class: modelElement.getAttribute('class'),
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createEditableElement('li', {
                    class: modelElement.getAttribute('class'),
                    'data-target': modelElement.getAttribute('data-target'),
                });
                return toWidgetEditable(li, viewWriter, {
                    label: 'tab list item',
                    draggable: false,
                });
            },
        });

        // Converters for 'tabEditBar' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: {
                name: 'div',
                classes: 'tab-edit-bar',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                // Return an empty view element, which essentially renders nothing
                return viewWriter.createContainerElement('div');
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tab-edit-bar',
                });
                return toWidget(div, viewWriter, {
                    label: 'tab edit bar',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'moveLeftButton' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: {
                name: 'button',
                classes: 'move-left-button',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Return nothing for data downcast
                return viewWriter.createContainerElement('button');
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Create a 'button' element for the editing downcast
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-left-button',
                    title: modelElement.getAttribute('title'),
                });
                // Convert the button to a widget
                return toWidget(button, viewWriter, {
                    label: 'move left',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'moveRightButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: {
                name: 'button',
                classes: 'move-right-button',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Return nothing for data downcast
                return viewWriter.createContainerElement('button');
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Create a 'button' element for the editing downcast
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-right-button',
                    title: modelElement.getAttribute('title'),
                });
                // Convert the button to a widget
                return toWidget(button, viewWriter, {
                    label: 'Move Tab Right',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Conversion for 'tabTitleEditBar' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabTitleEditBar',
            view: {
                name: 'div',
                classes: 'title-edit-bar',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitleEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'title-edit-bar',
                    isContentEditable: false,
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitleEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'title-edit-bar',
                });
                return toWidget(div, viewWriter, {
                    label: 'tab title edit bar',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'tabTitle' element (making it editable)
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: {
                name: 'span',
                classes: 'tab-title',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const span = writer.createEditableElement('span', { class: 'tab-title' });
                // Ensure text content is inserted properly
                return span;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const span = writer.createEditableElement('span', {
                    class: 'tab-title',
                    contenteditable: 'true', // Explicitly making it editable
                });
                // This must be handled carefully; perhaps you should only set up the container here
                return span;
            },
        });

        // Converters for 'removeTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'removeTabButton',
            view: {
                name: 'button',
                classes: 'remove-tab-button',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'removeTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Return nothing for data downcast
                return viewWriter.createContainerElement('button');
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'removeTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'remove-tab-button',
                    title: modelElement.getAttribute('title'),
                });
                return toWidget(button, viewWriter, {
                    label: 'delete tab-list-item button',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: {
                name: 'li',
                classes: 'add-tab-list-item',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('li', {
                    class: 'add-tab-list-item',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', {
                    class: 'add-tab-list-item',
                });
                return toWidget(li, viewWriter, {
                    label: 'add tab list item',
                    draggable: false,
                });
            },
        });

        // Converters for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: {
                name: 'button',
                classes: 'add-tab-button',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => writer.createEmptyElement('button', { class: 'add-tab-button' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                // Ensure the title attribute is correctly fetched and set
                const title = modelElement.getAttribute('title') || 'Add Tab'; // Fallback title
                const button = viewWriter.createContainerElement('button', {
                    class: 'add-tab-button',
                    title: title, // Setting title attribute from model to view
                });
                return toWidget(button, viewWriter, {
                    label: 'Add Tab',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: {
                name: 'div',
                classes: 'tab-content',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tab-content',
                    isContentEditable: false,
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tab-content',
                });
                return toWidget(div, viewWriter, {
                    label: 'tab content',
                    draggable: false,
                    isContentEditable: false,
                });
            },
        });

        // Converters for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: {
                name: 'div',
                classes: 'tab-nested-content',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                // Create a div that can contain various types of content
                const div = writer.createContainerElement('div', {
                    class: 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    contenteditable: 'true', // Ensure it's editable
                });
                return div;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                // Create a div that is editable and can be treated as a widget for dragging and other interactions
                const div = writer.createEditableElement('div', {
                    class: modelElement.getAttribute('class'),
                    id: modelElement.getAttribute('id'),
                });
                // Make this div a widget, which enables it to be a part of the editor's UI framework
                return toWidgetEditable(div, writer, {
                    label: 'Nested content area',
                });
            },
        });

        // Converters for 'tabNestedContentTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContentTitle',
            view: {
                name: 'div',
                classes: 'tab-nested-content-title',
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContentTitle',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createEditableElement('div', {
                    class: 'tab-nested-content-title',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContentTitle',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createEditableElement('div', {
                    class: 'tab-nested-content-title',
                });
            },
        });
    }
}
