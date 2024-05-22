import { Plugin } from '@ckeditor/ckeditor5-core';
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

    _defineSchema() {
        const schema = this.editor.model.schema;

        // Define schema for the tabs plugin and its child elements
        schema.register('tabsPlugin', {
            allowIn: '$root',
            allowWhere: '$block',
            isLimit: true,
        });
        // Define schema for 'tabList' element
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
        });
        // Define schema for 'tabListItem' element
        schema.register('tabListItem', {
            allowAttributes: ['class', 'data-target'],
            allowIn: 'tabList',
        });
        // Define schema for 'tabTitle' element
        schema.register('tabTitle', {
            allowAttributes: ['class'],
            allowContentOf: '$block',
            allowIn: 'tabListItem',
            disallow: ['$inlineObject', 'link', 'bold', 'italic', 'underline', '$block'],
            isLimit: true,
        });
        // Define schema for 'tabContent' element
        schema.register('tabContent', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
        });
        // Define schema for 'tabNestedContent' element
        schema.register('tabNestedContent', {
            allowAttributes: ['id', 'class'],
            allowContentOf: '$root', // Allow all root-level content, including block elements
            allowIn: 'tabContent',
            disallow: ['tabsPlugin'],
            isLimit: true,
        });
        // Define schema for 'tabEditBar' element
        schema.register('tabEditBar', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
        });
        // Define schema for 'moveButtonsWrapper' element
        schema.register('moveButtonsWrapper', {
            allowAttributes: ['class'],
            allowIn: 'tabEditBar',
        });
        // Define schema for 'moveLeftButton' element
        schema.register('moveLeftButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'moveButtonsWrapper',
        });
        // Define schema for 'moveRightButton' element
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'moveButtonsWrapper',
        });
        // Define schema for 'deleteTabButton' element
        schema.register('deleteTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabEditBar',
        });
        // Define schema for 'addTabListItem' element
        schema.register('addTabListItem', {
            allowAttributes: ['class'],
            allowIn: 'tabList',
        });
        // Define schema for 'addTabButton' element
        schema.register('addTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabListItem',
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
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('div', { class: 'tabs-plugin' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', { class: 'tabs-plugin' });
                return div;
            },
        });
        // Converters for 'tabList' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab-list' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('ul', { class: 'tab-list', draggable: false }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                const ul = viewWriter.createContainerElement('ul', { class: 'tab-list', draggable: false });
                return ul;
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
                    draggable: false,
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
                    draggable: false,
                });
                return li;
            },
        });
        // Converters for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tab-title' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createEditableElement('div', { class: 'tab-title' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createEditableElement('div', { class: 'tab-title' });
                return div;
            },
        });
        // Converters for 'tabEditBar' element
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('div', {
                    class: 'tab-edit-bar',
                    draggable: false,
                    contenteditable: false,
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tab-edit-bar',
                    draggable: false,
                    contenteditable: false,
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
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('div', {
                    class: 'move-buttons-wrapper',
                    draggable: false,
                    // contenteditable: false,
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'move-buttons-wrapper',
                    draggable: false,
                    // contenteditable: false,
                });
                return div;
            },
        });
        // Converters for 'moveLeftButton' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'button', classes: 'move-left-button' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-left-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Move Tab Left'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-left-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Move Tab Left'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
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
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-right-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Move Tab Right'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'move-right-button',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Move Tab Right'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        // Converters for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'delete-tab-button',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Delete Tab'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'delete-tab-button',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    isContentEditable: false,
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Delete Tab'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
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
                viewWriter.createContainerElement('li', { class: 'add-tab-list-item', draggable: false }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('li', {
                    class: 'add-tab-list-item',
                    isContentEditable: false,
                    draggable: false,
                }),
        });
        // Converters for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: (viewElement) => !viewElement,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'add-tab-button',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Add Tab'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
                return button;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const button = viewWriter.createContainerElement('button', {
                    class: 'add-tab-button',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    isContentEditable: false,
                    draggable: false,
                });
                const textSpan = viewWriter.createContainerElement('span', { draggable: false });
                viewWriter.insert(viewWriter.createPositionAt(textSpan, 0), viewWriter.createText('Add Tab'));
                viewWriter.insert(viewWriter.createPositionAt(button, 0), textSpan);
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
            view: (modelElement, { writer: viewWriter }) =>
                viewWriter.createContainerElement('div', { class: 'tab-content', draggable: false }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', { class: 'tab-content', draggable: false });
                return div;
            },
        });
        // Converters for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'tab-nested-content' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                const div = viewWriter.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    draggable: false,
                });
                return div;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                const classes = modelElement.getAttribute('class');
                const div = viewWriter.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    draggable: false,
                });
                return div;
            },
        });
    }
}
