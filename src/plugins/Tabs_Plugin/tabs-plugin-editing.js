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
            isLimit: true,
        });
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
        });
        schema.register('tabListItem', {
            allowAttributes: ['class', 'data-target'],
            allowIn: 'tabList',
            isLimit: true,
        });
        schema.register('tabListTable', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        schema.register('tabTitle', {
            allowAttributes: ['class'],
            allowContentOf: '$block',
            allowIn: 'tabListTable_td',
            isLimit: true,
        });
        schema.register('tabContent', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
        });
        schema.register('tabNestedContent', {
            allowAttributes: ['id', 'class'],
            allowContentOf: '$root', // Allow all root-level content, including block elements
            allowIn: 'tabContent',
            isLimit: true,
        });
        schema.register('moveLeftButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('deleteTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('addTabListItem', {
            allowAttributes: ['class'],
            allowIn: 'tabList',
            isLimit: true,
        });
        schema.register('addTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabListItem',
            isLimit: true,
        });
        schema.register('addicon', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabButton',
            isLimit: true,
        });
        schema.register('tabListTable_thead', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        schema.register('tabListTable_tr', {
            allowIn: ['tabListTable_thead', 'tabListTable_tbody'],
            isLimit: true,
        });
        schema.register('tabListTable_th', {
            allowIn: 'tabListTable_tr',
            isLimit: true,
        });
        schema.register('tabListTable_tbody', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        schema.register('tabListTable_td', {
            allowIn: 'tabListTable_tr',
            allowAttributes: ['colspan'],
            isLimit: true,
        });
    }

    // Defines the converters for the tabs plugin elements.
    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion for 'tabsPlugin' element
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabcontainer' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'tabcontainer' }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'tabcontainer' });
                return toWidget(div, writer, { label: 'tabs plugin' });
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'yui3-tabview-list' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('ul', { class: 'yui3-tabview-list', draggable: false }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => {
                const ul = writer.createContainerElement('ul', { class: 'yui3-tabview-list', draggable: false });
                return ul;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'tablinks' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createContainerElement('li', {
                    class: classes ? `tablinks ${classes}` : 'tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const li = writer.createContainerElement('li', {
                    class: classes ? `tablinks ${classes}` : 'tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                    draggable: false,
                });
                return li;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabListTable' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable',
            view: { name: 'table' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable',
            view: (modelElement, { writer }) => {
                const table = writer.createContainerElement('table');
                return table;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable',
            view: (modelElement, { writer }) => {
                const table = writer.createContainerElement('table');
                return table;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tabTitle' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                return writer.createEditableElement('div', { class: 'tabTitle' });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', { class: 'tabTitle' });
                return toWidgetEditable(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'moveLeftButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'div', classes: 'left-arrow' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'left-arrow',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'left-arrow',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'moveRightButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: { name: 'div', classes: 'right-arrow' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'right-arrow',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'right-arrow',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: { name: 'div', classes: 'dropicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: 'addtab' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('li', {
                    class: 'addtab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) => {
                const li = writer.createContainerElement('li', {
                    class: 'addtab',
                    draggable: false,
                });
                return li;
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'addicon',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Add Tab'));
                writer.insert(writer.createPositionAt(div, 0), textSpan);
                return div;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'addicon',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    draggable: false,
                });
                const textSpan = writer.createContainerElement('span', { draggable: false });
                writer.insert(writer.createPositionAt(textSpan, 0), writer.createText('Add Tab'));
                writer.insert(writer.createPositionAt(div, 0), textSpan);
                return toWidget(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'yui3-tabview-panel' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'yui3-tabview-panel', draggable: false }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'yui3-tabview-panel', draggable: false });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'tabcontent' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createEditableElement('div', {
                    class: classes ? `tabcontent ${classes}` : 'tabcontent',
                    id: modelElement.getAttribute('id'),
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes ? `tabcontent ${classes}` : 'tabcontent',
                    id: modelElement.getAttribute('id'),
                });
                return toWidgetEditable(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'thead' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable_thead',
            view: 'thead',
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable_thead',
            view: 'thead',
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable_thead',
            view: 'thead',
            converterPriority: 'high',
        });

        // Conversion for 'tr' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable_tr',
            view: 'tr',
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable_tr',
            view: 'tr',
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable_tr',
            view: 'tr',
            converterPriority: 'high',
        });

        // Conversion for 'th' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable_th',
            view: 'th',
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable_th',
            view: 'th',
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable_th',
            view: 'th',
            converterPriority: 'high',
        });

        // Conversion for 'tbody' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable_tbody',
            view: 'tbody',
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable_tbody',
            view: 'tbody',
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable_tbody',
            view: 'tbody',
            converterPriority: 'high',
        });

        // Conversion for 'td' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable_td',
            view: 'td',
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListTable_td',
            view: 'td',
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable_td',
            view: 'td',
            converterPriority: 'high',
        });
    }
}
