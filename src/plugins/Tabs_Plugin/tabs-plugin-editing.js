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
        // Define schema for 'containerDiv' element
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
        });
        // Define schema for 'tabHeader' element
        schema.register('tabHeader', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
            isLimit: true,
        });
        // Define schema for 'tabList' element
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
        });
        // Define schema for 'tabListItem' element
        schema.register('tabListItem', {
            allowAttributes: ['class', 'data-target'],
            allowIn: 'tabList',
            isLimit: true,
        });
        // Define schema for 'tabListTable' element
        schema.register('tabListTable', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        // Define schema for 'tabTitle' element
        schema.register('tabTitle', {
            allowAttributes: ['class'],
            allowContentOf: '$block',
            allowIn: 'tabListItem',
            isLimit: true,
        });
        // Define schema for 'tabContent' element
        schema.register('tabContent', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
        });
        // Define schema for 'tabNestedContent' element
        schema.register('tabNestedContent', {
            allowAttributes: ['id', 'class'],
            allowContentOf: '$root', // Allow all root-level content, including block elements
            allowIn: 'tabContent',
            isLimit: true,
        });
        // Define schema for 'moveButtonsWrapper' element
        schema.register('moveButtonsWrapper', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        // Define schema for 'moveLeftButton' element
        schema.register('moveLeftButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'moveButtonsWrapper',
            isLimit: true,
        });
        // Define schema for 'moveRightButton' element
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'moveButtonsWrapper',
            isLimit: true,
        });
        // Define schema for 'deleteTabButton' element
        schema.register('deleteTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabEditBar',
            isLimit: true,
        });
        // Define schema for 'dropParagraph' element
        schema.register('dropParagraph', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        // Define schema for 'addTabListItem' element
        schema.register('addTabListItem', {
            allowAttributes: ['class'],
            allowIn: 'tabList',
            isLimit: true,
        });
        // Define schema for 'addTabButton' element
        schema.register('addTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabListItem',
            isLimit: true,
        });
        // Define schema for 'addTabIcon' element
        schema.register('addTabIcon', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabButton',
            isLimit: true,
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

        // Conversion for 'tabsPlugin' element
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: 'tabcontainer' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tabcontainer yui3-widget', draggable: false }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const container = writer.createContainerElement('div', {
                    class: 'tabcontainer yui3-widget',
                    unselectable: 'on',
                    draggable: false,
                });
                return toWidget(container, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'containerDiv' element
        conversion.for('upcast').elementToElement({
            model: 'containerDiv',
            view: {
                name: 'div',
                classes:
                    'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'containerDiv',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'containerDiv',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                    draggable: false,
                    contenteditable: 'false',
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabHeader' element
        conversion.for('upcast').elementToElement({
            model: 'tabHeader',
            view: { name: 'div', classes: 'tabheader ah-tabs-horizontal' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                    draggable: false,
                    contenteditable: 'false',
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: 'tab yui3-tabview-list' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('ul', { class: 'tab yui3-tabview-list', draggable: false }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => {
                const ul = writer.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    draggable: false,
                    contenteditable: 'false',
                });
                return ul;
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: { name: 'li', classes: 'yui3-tab tablinks' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createContainerElement('li', {
                    class: classes ? `yui3-tab tablinks ${classes}` : 'yui3-tab tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const li = writer.createContainerElement('li', {
                    class: classes ? `yui3-tab tablinks ${classes}` : 'yui3-tab tablinks',
                    'data-target': modelElement.getAttribute('data-target'),
                    draggable: false,
                    contenteditable: 'false',
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
                const table = writer.createContainerElement('table', { draggable: false });
                return table;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListTable',
            view: (modelElement, { writer }) => {
                const table = writer.createContainerElement('table', { draggable: false });
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
                return writer.createEditableElement('div', { class: 'tabTitle', draggable: false });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', {
                    class: 'tabTitle',
                    contenteditable: 'true',
                    draggable: false,
                });
                return toWidgetEditable(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabEditBar' element
        conversion.for('upcast').elementToElement({
            model: 'tabEditBar',
            view: { name: 'div', classes: 'yui3-tab-label' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', { class: 'yui3-tab-label', draggable: false });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabEditBar',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    class: 'yui3-tab-label',
                    draggable: false,
                    contenteditable: false,
                });
                return div;
            },
            converterPriority: 'high',
        });

        // Conversion for 'moveButtonsWrapper' element
        conversion.for('upcast').elementToElement({
            model: 'moveButtonsWrapper',
            view: { name: 'div', classes: 'move-buttons-wrapper' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', { class: 'move-buttons-wrapper', draggable: false });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveButtonsWrapper',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'move-buttons-wrapper', draggable: false });
                return div;
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
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                    contenteditable: 'false',
                }),
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
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: modelElement.getAttribute('title') || 'Move Tab',
                    draggable: false,
                    contenteditable: 'false',
                }),
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
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: modelElement.getAttribute('title') || 'Delete Tab',
                    draggable: false,
                    contenteditable: 'false',
                }),
            converterPriority: 'high',
        });

        // Conversion for 'dropParagraph' element
        conversion.for('upcast').elementToElement({
            model: 'dropParagraph',
            view: { name: 'p', classes: 'droptab droptabicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'dropParagraph',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'droptab droptabicon',
                    title: modelElement.getAttribute('title'),
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'dropParagraph',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'droptab droptabicon',
                    title: modelElement.getAttribute('title'),
                    draggable: false,
                    contenteditable: 'false',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: 'yui3-tab addtab' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('li', {
                    class: 'yui3-tab addtab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) => {
                const li = writer.createContainerElement('li', {
                    class: 'yui3-tab addtab',
                    isContentEditable: false,
                    draggable: false,
                });
                return li;
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addtabicon' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'addtabicon',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    draggable: false,
                }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'addtabicon',
                    title: modelElement.getAttribute('title') || 'Add Tab',
                    isContentEditable: false,
                    draggable: false,
                }),
            converterPriority: 'high',
        });

        // Conversion for 'addTabIcon' element
        conversion.for('upcast').elementToElement({
            model: 'addTabIcon',
            view: { name: 'p', classes: 'addtabicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabIcon',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('p', { class: 'addtabicon', draggable: false }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabIcon',
            view: (modelElement, { writer }) => {
                const p = writer.createContainerElement('p', { class: 'addtabicon', draggable: false });
                return p;
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
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', { class: 'yui3-tabview-panel', draggable: false });
            },
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
            view: { name: 'div', classes: 'yui3-tab-panel tabcontent' },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                return writer.createEditableElement('div', {
                    class: classes ? `yui3-tab-panel tabcontent ${classes}` : 'yui3-tab-panel tabcontent',
                    id: modelElement.getAttribute('id'),
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const classes = modelElement.getAttribute('class');
                const div = writer.createEditableElement('div', {
                    class: classes ? `yui3-tab-panel tabcontent ${classes}` : 'yui3-tab-panel tabcontent',
                    id: modelElement.getAttribute('id'),
                    contenteditable: 'true',
                    draggable: false,
                });
                return toWidgetEditable(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for table elements
        const tableElements = ['table', 'thead', 'tr', 'th', 'tbody', 'td'];
        for (const element of tableElements) {
            conversion.for('upcast').elementToElement({
                model: element,
                view: element,
                converterPriority: 'high',
            });
            conversion.for('dataDowncast').elementToElement({
                model: element,
                view: (modelElement, { writer }) => {
                    return writer.createContainerElement(element, { draggable: false });
                },
                converterPriority: 'high',
            });
            conversion.for('editingDowncast').elementToElement({
                model: element,
                view: (modelElement, { writer }) => {
                    const el = writer.createContainerElement(element, {
                        draggable: false,
                        contenteditable: 'false',
                    });
                    return toWidget(el, writer);
                },
                converterPriority: 'high',
            });
        }
    }
}
