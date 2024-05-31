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
        // Define schema for 'containerDiv' element
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
        });
        // Define schema for 'tabHeader' element
        schema.register('tabHeader', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
        });
        // Define schema for 'tabList' element
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabHeader',
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
        // Define schema for 'dropParagraph' element
        schema.register('dropParagraph', {
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

        // Define schema for 'thead' element
        schema.register('thead', {
            allowIn: 'table',
        });
        // Define schema for 'tr' element
        schema.register('tr', {
            allowIn: ['thead', 'tbody'],
        });
        // Define schema for 'th' element
        schema.register('th', {
            allowIn: 'tr',
        });
        // Define schema for 'tbody' element
        schema.register('tbody', {
            allowIn: 'table',
        });
        // Define schema for 'td' element
        schema.register('td', {
            allowIn: 'tr',
            allowAttributes: ['colspan'],
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion for 'tabcontainer' element
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabcontainer' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabcontainer yui3-widget' },
        });

        // Conversion for 'containerDiv' element
        conversion.for('upcast').elementToElement({
            model: 'containerDiv',
            view: {
                name: 'div',
                classes:
                    'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
            },
        });
        conversion.for('downcast').elementToElement({
            model: 'containerDiv',
            view: {
                name: 'div',
                classes:
                    'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
            },
        });

        // Conversion for 'tabHeader' element
        conversion.for('upcast').elementToElement({
            model: 'tabHeader',
            view: { name: 'div', classes: 'tabheader ah-tabs-horizontal' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabHeader',
            view: { name: 'div', classes: 'tabheader ah-tabs-horizontal' },
        });

        // Conversion for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab yui3-tabview-list' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab yui3-tabview-list' },
        });

        // Conversion for 'tabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'yui3-tab tablinks' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createContainerElement('li', {
                    class: classes ? `yui3-tab tablinks ${classes}` : 'yui3-tab tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                });
            },
        });

        // Conversion for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tabTitle' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tabTitle' },
        });

        // Conversion for 'tabEditBar' element
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: { name: 'div', classes: 'yui3-tab-label' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabEditBar',
            view: { name: 'div', classes: 'yui3-tab-label' },
        });

        // Conversion 'moveButtonsWrapper' element
        conversion.for('upcast').elementToElement({
            model: 'moveButtonsWrapper',
            view: { name: 'th' },
        });
        conversion.for('downcast').elementToElement({
            model: 'moveButtonsWrapper',
            view: { name: 'th' },
        });

        // Conversion for 'moveLeftButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'div', classes: 'left-arrow' },
        });
        conversion.for('downcast').elementToElement({
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
        conversion.for('downcast').elementToElement({
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
            view: { name: 'div', classes: 'dropicon', attributes: { contenteditable: 'false' } },
        });
        conversion.for('downcast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    contenteditable: 'false',
                }),
        });

        // Conversion for 'paragraph' element
        conversion.for('upcast').elementToElement({
            model: 'paragraph',
            view: { name: 'p', classes: 'droptab droptabicon', attributes: { contenteditable: 'true' } },
        });
        conversion.for('downcast').elementToElement({
            model: 'paragraph',
            view: { name: 'p', classes: 'droptab droptabicon', attributes: { contenteditable: 'true' } },
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: 'yui3-tab addtab' },
        });
        conversion.for('downcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: 'yui3-tab addtab' },
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addicon' },
        });
        conversion.for('downcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addicon' },
        });

        // Conversion for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'yui3-tabview-panel' },
        });
        conversion.for('downcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'yui3-tabview-panel' },
        });

        // Conversion for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: { name: 'div', classes: 'yui3-tab-panel tabcontent' },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createEditableElement('div', {
                    class: classes ? `yui3-tab-panel tabcontent ${classes}` : 'yui3-tab-panel tabcontent',
                    id: modelElement.getAttribute('id'),
                });
            },
        });

        // Converter for 'table' element
        conversion.for('downcast').elementToElement({
            model: 'table',
            view: { name: 'table' },
        });
        // Converter for 'thead' element
        conversion.for('upcast').elementToElement({
            model: 'thead',
            view: 'thead',
        });
        conversion.for('downcast').elementToElement({
            model: 'thead',
            view: 'thead',
        });

        // Converter for 'tr' element
        conversion.for('upcast').elementToElement({
            model: 'tr',
            view: 'tr',
        });
        conversion.for('downcast').elementToElement({
            model: 'tr',
            view: 'tr',
        });

        // Converter for 'th' element
        conversion.for('upcast').elementToElement({
            model: 'th',
            view: 'th',
        });
        conversion.for('downcast').elementToElement({
            model: 'th',
            view: 'th',
        });

        // Converter for 'tbody' element
        conversion.for('upcast').elementToElement({
            model: 'tbody',
            view: 'tbody',
        });
        conversion.for('downcast').elementToElement({
            model: 'tbody',
            view: 'tbody',
        });

        // Converter for 'td' element
        conversion.for('upcast').elementToElement({
            model: 'td',
            view: 'td',
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'td',
            view: 'td',
        });
    }
}
