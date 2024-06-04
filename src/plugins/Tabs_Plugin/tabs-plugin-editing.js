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
            disallow: ['$inlineObject', 'link', 'bold', 'italic', 'underline', '$block', 'tabsPlugin'],
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

    // Defines the converters for the tabs plugin elements.
    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion for 'tabsPlugin' element
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabs-plugin' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tabs-plugin data-downcast' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'tabs-plugin' });
                return toWidget(div, writer, { label: 'tabs plugin' });
            },
        });

        // Conversion for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab-list' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('ul', { class: 'tab-list data-downcast', draggable: false }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => {
                const ul = writer.createContainerElement('ul', { class: 'tab-list', draggable: false });
                return ul;
            },
        });

        // Conversion for 'tabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'tab-list-item' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createContainerElement('li', {
                    class: classes ? `tab-list-item data-downcast ${classes}` : 'tab-list-item data-downcast',
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const li = writer.createContainerElement('li', {
                    class: classes ? `tab-list-item ${classes}` : 'tab-list-item',
                    'data-target': modelElement.getAttribute('data-target'),
                    draggable: false,
                });
                return li;
            },
        });

        // Conversion for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tab-title' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) =>
                writer.createEditableElement('div', { class: 'tab-title data-downcast' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', { class: 'tab-title', draggable: false });
                return toWidgetEditable(div, writer);
            },
        });

        // Conversion for 'tabEditBar' element
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: () => null,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tab-edit-bar data-downcast-view' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'tab-edit-bar',
                    draggable: false,
                    contenteditable: false,
                });
                return div;
            },
        });

        // Conversion 'moveButtonsWrapper' element
        conversion.for('upcast').elementToElement({ model: 'moveButtonsWrapper', view: () => null });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'move-buttons-wrapper data-downcast-view' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'move-buttons-wrapper', draggable: false });
                return div;
            },
        });

        // Conversion for 'moveLeftButton' element (HTML to Model)
        conversion.for('upcast').elementToElement({ model: 'moveLeftButton', view: () => null });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-left-button data-downcast-view',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
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
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Left'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Conversion for 'moveRightButton' element
        conversion.for('upcast').elementToElement({ model: 'moveRightButton', view: () => null });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'move-right-button data-downcast-view',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
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
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Move Tab Right'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Conversion for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: () => null,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'delete-tab-button data-downcast-view',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
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
                    isContentEditable: false,
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Delete Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: () => null,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('li', {
                    class: 'add-tab-list-item data-downcast-view',
                    draggable: false,
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('li', {
                    class: 'add-tab-list-item',
                    isContentEditable: false,
                    draggable: false,
                }),
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: () => null,
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                const button = writer.createContainerElement('button', {
                    class: 'add-tab-button data-downcast-view',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
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
                    isContentEditable: false,
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Add Tab'));
                writer.insert(writer.createPositionAt(button, 0), textSpan);
                return button;
            },
        });

        // Conversion for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'tab-content' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tab-content', draggable: false }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'tab-content', draggable: false });
                return div;
            },
        });

        // Conversion for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'tab-nested-content' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    draggable: false,
                });
                return div;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes ? `tab-nested-content ${classes}` : 'tab-nested-content',
                    id: modelElement.getAttribute('id'),
                    draggable: false,
                });
                return toWidgetEditable(div, writer);
            },
        });
    }
}
