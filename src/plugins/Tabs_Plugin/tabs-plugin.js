import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import tabToolbarIcon from './assets/icon-tab.svg';
import './styles/tabs-plugin.css';

export default class TabsPlugin extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add('tabsPlugin', new InsertTabsCommand(this.editor));
        this.editor.commands.add('addTab', new AddTabCommand(this.editor));
        this.editor.commands.add('moveTab', new MoveTabCommand(this.editor));
        this.editor.commands.add('deleteTab', new DeleteTabCommand(this.editor));

        this._addToolbarButton();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('tabsContainer', {
            isObject: true,
            allowWhere: '$block',
        });

        schema.register('tabHeader', {
            isObject: true,
            allowIn: 'tabsContainer',
            allowContentOf: '$block',
        });

        schema.register('tabContent', {
            isObject: true,
            allowIn: 'tabsContainer',
            allowContentOf: '$block',
        });

        schema.register('tabItem', {
            isObject: true,
            allowIn: 'tabHeader',
            allowAttributes: ['title', 'index', 'isActive'],
        });

        schema.register('tabPanel', {
            isLimit: true,
            allowIn: 'tabContent',
            allowContentOf: '$block',
        });

        schema.register('addTabButton', {
            isObject: true,
            allowIn: 'tabHeader',
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Tabs container
        conversion.for('upcast').elementToElement({
            model: 'tabsContainer',
            view: {
                name: 'div',
                classes: 'tabcontainer',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabsContainer',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabcontainer yui3-widget',
                    id: 'plugin_' + Date.now() + '_0',
                });
                return div;
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabsContainer',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabcontainer yui3-widget',
                    id: 'plugin_' + Date.now() + '_0',
                });
                return toWidget(div, viewWriter);
            },
        });

        // Tab header
        conversion.for('upcast').elementToElement({
            model: 'tabHeader',
            view: {
                name: 'div',
                classes: 'tabheader',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                });
                const ul = viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.getAttribute('id') + '-tabList',
                });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), ul);
                return div;
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                });
                const ul = viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.getAttribute('id') + '-tabList',
                });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), ul);
                return toWidget(div, viewWriter);
            },
        });

        // Tab item
        conversion.for('upcast').elementToElement({
            model: (viewElement, { writer }) => {
                return writer.createElement('tabItem', {
                    title: viewElement.getAttribute('data-title'),
                    index: viewElement.getAttribute('data-index'),
                    isActive: viewElement.hasClass('active'),
                });
            },
            view: {
                name: 'li',
                classes: 'yui3-tab',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabItem',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', {
                    class: 'yui3-tab tablinks' + (modelElement.getAttribute('isActive') ? ' active' : ''),
                    'data-index': modelElement.getAttribute('index'),
                });

                // Create the complex inner structure
                const innerStructure = this._createTabItemInnerStructure(
                    viewWriter,
                    modelElement.getAttribute('title')
                );
                viewWriter.insert(viewWriter.createPositionAt(li, 0), innerStructure);

                return li;
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabItem',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', {
                    class: 'yui3-tab tablinks' + (modelElement.getAttribute('isActive') ? ' active' : ''),
                    'data-index': modelElement.getAttribute('index'),
                });

                // Create the complex inner structure
                const innerStructure = this._createTabItemInnerStructure(
                    viewWriter,
                    modelElement.getAttribute('title')
                );
                viewWriter.insert(viewWriter.createPositionAt(li, 0), innerStructure);

                return toWidget(li, viewWriter);
            },
        });

        // Tab content
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: {
                name: 'div',
                classes: 'yui3-tabview-panel',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    id: modelElement.parent.getAttribute('id') + '-tabContent',
                });
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    id: modelElement.parent.getAttribute('id') + '-tabContent',
                });
                return toWidget(div, viewWriter);
            },
        });

        // Tab panel
        conversion.for('upcast').elementToElement({
            model: 'tabPanel',
            view: {
                name: 'div',
                classes: 'yui3-tab-panel',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabPanel',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class:
                        'yui3-tab-panel tabcontent' +
                        (modelElement.parent.index === modelElement.index ? ' active' : ''),
                });
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabPanel',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class:
                        'yui3-tab-panel tabcontent' +
                        (modelElement.parent.index === modelElement.index ? ' active' : ''),
                });
                return toWidgetEditable(div, viewWriter);
            },
        });

        // Add Tab Button
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: {
                name: 'li',
                classes: 'yui3-tab addtab',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab' });
                const div = viewWriter.createContainerElement('div', { class: 'addicon', title: 'Add Tab' });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return li;
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab' });
                const div = viewWriter.createContainerElement('div', { class: 'addicon', title: 'Add Tab' });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return toWidget(li, viewWriter);
            },
        });
    }

    _createTabItemInnerStructure(viewWriter, title) {
        const div = viewWriter.createContainerElement('div', { class: 'yui3-tab-label' });
        const table = viewWriter.createContainerElement('table');
        const thead = viewWriter.createContainerElement('thead');
        const tbody = viewWriter.createContainerElement('tbody');

        const theadTr = viewWriter.createContainerElement('tr');
        const thLeft = viewWriter.createContainerElement('th');
        const thRight = viewWriter.createContainerElement('th');
        const thDelete = viewWriter.createContainerElement('th');

        const leftArrow = viewWriter.createContainerElement('div', {
            class: 'left-arrow arrowtabicon',
            title: 'Move Tab',
        });
        const rightArrow = viewWriter.createContainerElement('div', {
            class: 'right-arrow arrowtabicon',
            title: 'Move Tab',
        });
        const deleteIcon = viewWriter.createContainerElement('div', { class: 'dropicon', title: 'Delete Tab' });
        const deleteP = viewWriter.createContainerElement('p', { class: 'droptab droptabicon' });
        viewWriter.insert(viewWriter.createPositionAt(deleteP, 0), viewWriter.createEmptyElement('br'));

        viewWriter.insert(viewWriter.createPositionAt(thLeft, 0), leftArrow);
        viewWriter.insert(viewWriter.createPositionAt(thRight, 0), rightArrow);
        viewWriter.insert(viewWriter.createPositionAt(deleteIcon, 0), deleteP);
        viewWriter.insert(viewWriter.createPositionAt(thDelete, 0), deleteIcon);

        viewWriter.insert(viewWriter.createPositionAt(theadTr, 0), thLeft);
        viewWriter.insert(viewWriter.createPositionAt(theadTr, 1), thRight);
        viewWriter.insert(viewWriter.createPositionAt(theadTr, 2), thDelete);

        const tbodyTr = viewWriter.createContainerElement('tr');
        const tbodyTd = viewWriter.createContainerElement('td', { colspan: '5' });
        const titleDiv = viewWriter.createContainerElement('div', { class: 'tabTitle' });
        viewWriter.insert(viewWriter.createPositionAt(titleDiv, 0), viewWriter.createText(title));

        viewWriter.insert(viewWriter.createPositionAt(tbodyTd, 0), titleDiv);
        viewWriter.insert(viewWriter.createPositionAt(tbodyTr, 0), tbodyTd);

        viewWriter.insert(viewWriter.createPositionAt(thead, 0), theadTr);
        viewWriter.insert(viewWriter.createPositionAt(tbody, 0), tbodyTr);
        viewWriter.insert(viewWriter.createPositionAt(table, 0), thead);
        viewWriter.insert(viewWriter.createPositionAt(table, 1), tbody);
        viewWriter.insert(viewWriter.createPositionAt(div, 0), table);

        return div;
    }

    _addToolbarButton() {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const button = new ButtonView(locale);

            button.set({
                icon: tabToolbarIcon,
                label: t('Insert Tabs'),
                withText: true,
                tooltip: true,
            });

            button.on('execute', () => {
                editor.execute('tabsPlugin');
            });

            return button;
        });
    }
}

class InsertTabsCommand extends Command {
    execute() {
        const editor = this.editor;
        editor.model.change((writer) => {
            const tabsContainer = writer.createElement('tabsContainer');
            const tabHeader = writer.createElement('tabHeader');
            const tabContent = writer.createElement('tabContent');

            writer.append(tabHeader, tabsContainer);
            writer.append(tabContent, tabsContainer);

            for (let i = 1; i <= 4; i++) {
                const tabItem = writer.createElement('tabItem', {
                    title: `Tab Name ${i}`,
                    index: i - 1,
                    isActive: i === 1,
                });
                const tabPanel = writer.createElement('tabPanel');
                writer.append(writer.createText(`Tab Content ${i}`), tabPanel);

                writer.append(tabItem, tabHeader);
                writer.append(tabPanel, tabContent);
            }

            const addTabButton = writer.createElement('addTabButton');
            writer.append(addTabButton, tabHeader);

            editor.model.insertContent(tabsContainer);
        });
    }
}

class AddTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabsElement = selection.getFirstPosition().findAncestor('tabs');

            if (tabsElement) {
                const newTab = writer.createElement('tab', { title: `New Tab` });
                const tabContent = writer.createElement('tabContent');
                writer.append(tabContent, newTab);
                writer.append(newTab, tabsElement);
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabsElement = selection.getFirstPosition().findAncestor('tabs');

        this.isEnabled = !!tabsElement;
    }
}

class MoveTabCommand extends Command {
    execute(options) {
        const { direction } = options;
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabElement = selection.getFirstPosition().findAncestor('tab');
            const tabsElement = tabElement.parent;

            if (tabElement && tabsElement) {
                const index = tabsElement.getChildIndex(tabElement);
                const newIndex = direction === 'left' ? index - 1 : index + 1;

                if (newIndex >= 0 && newIndex < tabsElement.childCount) {
                    writer.move(writer.createRangeOn(tabElement), tabsElement, newIndex);
                }
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabElement = selection.getFirstPosition().findAncestor('tab');

        this.isEnabled = !!tabElement;
    }
}

class DeleteTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabElement = selection.getFirstPosition().findAncestor('tab');

            if (tabElement) {
                writer.remove(tabElement);
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabElement = selection.getFirstPosition().findAncestor('tab');

        this.isEnabled = !!tabElement;
    }
}
