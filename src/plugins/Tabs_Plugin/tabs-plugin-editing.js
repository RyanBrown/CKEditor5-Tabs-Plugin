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

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion for 'tabsPlugin' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabcontainer' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tabcontainer yui3-widget' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'tabcontainer yui3-widget' });
                return toWidget(div, writer, { label: 'tabs plugin' });
            },
        });

        // Conversion for 'tabList' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab yui3-tabview-list' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => writer.createContainerElement('ul', { class: 'tab yui3-tabview-list' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => {
                const ul = writer.createContainerElement('ul', { class: 'tab yui3-tabview-list' });
                return ul;
            },
        });

        // Conversion for 'tabListItem'
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'yui3-tab yui3-tab-selected tablinks' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createContainerElement('li', {
                    class: classes
                        ? `yui3-tab yui3-tab-selected tablinks ${classes}`
                        : 'yui3-tab yui3-tab-selected tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const li = writer.createContainerElement('li', {
                    class: classes
                        ? `yui3-tab yui3-tab-selected tablinks ${classes}`
                        : 'yui3-tab yui3-tab-selected tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                });
                return toWidget(li, writer);
            },
        });

        // Conversion for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tabTitle' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => writer.createEditableElement('div', { class: 'tabTitle' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', { class: 'tabTitle' });
                return toWidgetEditable(div, writer);
            },
        });

        // Conversion for 'tabEditBar' element
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: { name: 'div', classes: 'yui3-tab-label' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'yui3-tab-label' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'yui3-tab-label' });
                return div;
            },
        });

        // Conversion 'moveButtonsWrapper' element
        conversion.for('upcast').elementToElement({
            model: 'moveButtonsWrapper',
            view: { name: 'th' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) => writer.createContainerElement('th'),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) => {
                const th = writer.createContainerElement('th');
                return th;
            },
        });

        // Conversion for 'moveLeftButton' element (HTML to Model)
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'div', classes: 'left-arrow' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab Left',
                }),
        });

        // Conversion for 'moveRightButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: { name: 'div', classes: 'right-arrow' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab Right',
                }),
        });

        // Conversion for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: { name: 'div', classes: 'dropicon' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                }),
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: 'yui3-tab addtab' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) => writer.createContainerElement('li', { class: 'yui3-tab addtab' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) => writer.createContainerElement('li', { class: 'yui3-tab addtab' }),
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addicon' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'addicon' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'addicon' }),
        });

        // Conversion for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'yui3-tabview-panel' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'yui3-tabview-panel' }),
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'yui3-tabview-panel' });
                return div;
            },
        });

        // Conversion for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'yui3-tab-panel-selected tabcontent' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes
                        ? `yui3-tab-panel-selected tabcontent ${classes}`
                        : 'yui3-tab-panel-selected tabcontent',
                    id: modelElement.getAttribute('id'),
                });
                return div;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes
                        ? `yui3-tab-panel-selected tabcontent ${classes}`
                        : 'yui3-tab-panel-selected tabcontent',
                    id: modelElement.getAttribute('id'),
                });
                return toWidgetEditable(div, writer);
            },
        });
    }
}
