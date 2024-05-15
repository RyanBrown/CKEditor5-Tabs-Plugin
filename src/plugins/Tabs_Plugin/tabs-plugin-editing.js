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
            allowContentOf: [], // Disallow all content within the button
        });

        // Define schema for 'moveRightButton' element
        schema.register('moveRightButton', {
            isObject: true,
            allowIn: 'tabEditBar',
            allowAttributes: ['class', 'title'],
            allowContentOf: [], // Disallow all content within the button
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

        // Define schema for 'addTabListItem' element
        schema.register('addTabButton', {
            isObject: true,
            allowIn: 'tabList',
            allowAttributes: ['class', 'title'],
            allowContentOf: [], // Disallow all content within the button
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
            view: { name: 'div', classes: 'tabs-plugin' },
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

        // Helper function to create a 'ul' view element for 'tabList'
        function createTabListViewElement(writer) {
            return writer.createContainerElement('ul', { class: 'tab-list', isContentEditable: false });
        }
        // Converters for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab-list' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => createTabListViewElement(writer),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => createTabListViewElement(writer),
        });

        // Conversion for 'tabListItem'
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'tab-list-item' },
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
                    isContentEditable: true, // Making the element editable directly
                });
                return li;
            },
        });

        // Converters for 'tabEditBar' element (HTML to Model)
        // Optionally disable or remove this if you don't want 'tabEditBar' to be created from HTML content
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
                    isContentEditable: false,
                });
                return div;
            },
        });

        // Converters for 'moveLeftButton' element (HTML to Model)
        // Optionally disable or remove this if you don't want 'moveLeftButton' to be created from HTML content
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: (viewElement) => !viewElement,
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
                    isContentEditable: false, // Buttons shouldn't be editable
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Left'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'moveRightButton' element
        // Optionally disable or remove this if you don't want 'moveRightButton' to be created from HTML content
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: (viewElement) => !viewElement,
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
                    isContentEditable: false, // Buttons shouldn't be editable
                });
                // Create and insert the span with text
                const textSpan = writer.createContainerElement('span');
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Right'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Converters for 'tabTitle' element (making it editable)
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'span', classes: 'tab-title' },
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
        // Optionally disable or adjust this if you don't want 'removeTabButton' to be created from HTML content
        conversion.for('upcast').elementToElement({
            model: 'removeTabButton',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'removeTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'remove-tab-button',
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
            model: 'removeTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'remove-tab-button',
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
        // Optionally disable or adjust this if you don't want 'addTabListItem' to be created from HTML content
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
        // Optionally remove or disable this if you don't want 'addTabButton' to be created from HTML content
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

        // Helper function to create a 'div' view element for 'tabContent'
        function createTabContentViewElement(writer) {
            return writer.createContainerElement('div', { class: 'tab-content', isContentEditable: false });
        }
        // Converters for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'tab-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => createTabContentViewElement(writer),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => createTabContentViewElement(writer),
        });

        // Converters for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'tab-nested-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    contenteditable: 'true',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', {
                    class: modelElement.getAttribute('class'),
                    id: modelElement.getAttribute('id'),
                    isContentEditable: true,
                });
                return div;
            },
        });

        // Converters for 'tabNestedContentTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContentTitle',
            view: { name: 'div', classes: 'tab-nested-content-title' },
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
