import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import tabToolbarIcon from './assets/icon-tab.svg';
import './styles/tabs-plugin.css';

export default class TabsPlugin extends Plugin {
    constructor(editor) {
        super(editor);
        this.showTabCountPrompt = true; // New boolean variable to toggle tab count prompt
    }

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
        this._setupEventListeners();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('tabsPlugin', {
            isObject: true,
            allowWhere: '$block',
        });

        schema.register('tabsContainerDiv', {
            isObject: true,
            allowIn: 'tabsPlugin',
        });

        schema.register('tabHeader', {
            isObject: true,
            allowIn: 'tabsContainerDiv',
        });

        schema.register('tabList', {
            isObject: true,
            allowIn: 'tabHeader',
        });

        schema.register('tabContent', {
            isObject: true,
            allowIn: 'tabsContainerDiv',
        });

        schema.register('tabItem', {
            isObject: true,
            allowIn: 'tabList',
            allowAttributes: ['title', 'index', 'isActive'],
        });

        schema.register('tabPanel', {
            isLimit: true,
            allowIn: 'tabContent',
            allowContentOf: '$block',
        });

        schema.register('addTabButton', {
            isObject: true,
            allowIn: 'tabList',
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Tabs container
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: ['tabcontainer', 'yui3-widget'] },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabcontainer yui3-widget',
                    id: 'plugin_' + Date.now() + '_0',
                });
                return div;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabcontainer yui3-widget',
                    id: 'plugin_' + Date.now() + '_0',
                });
                return toWidget(div, viewWriter);
            },
        });

        // Tabs inner container
        conversion.for('upcast').elementToElement({
            model: 'tabsContainerDiv',
            view: {
                name: 'div',
                classes: [
                    'ah-tabs-horizontal',
                    'ah-responsiveselecttabs',
                    'ah-content-space-v',
                    'yui3-ah-responsiveselecttabs-content',
                    'yui3-tabview-content',
                ],
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsContainerDiv',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                    draggable: 'false',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsContainerDiv',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                    draggable: 'false',
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
                return viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                    draggable: 'false',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                    draggable: 'false',
                });
                return toWidget(div, viewWriter);
            },
        });

        // Tab list
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: {
                name: 'ul',
                classes: ['tab', 'yui3-tabview-list'],
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.parent.parent.getAttribute('id') + '-tabList',
                    draggable: 'false',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                const ul = viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.parent.parent.getAttribute('id') + '-tabList',
                    draggable: 'false',
                });
                return toWidget(ul, viewWriter);
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
                const isActive = modelElement.getAttribute('isActive');
                const li = viewWriter.createContainerElement('li', {
                    class: `yui3-tab tablinks${isActive ? ' active' : ''}`,
                    'data-index': modelElement.getAttribute('index'),
                    draggable: 'false',
                });

                const innerStructure = this._createTabItemInnerStructure(
                    viewWriter,
                    modelElement.getAttribute('title'),
                    modelElement.getAttribute('index'),
                    modelElement.parent.childCount,
                    isActive
                );
                viewWriter.insert(viewWriter.createPositionAt(li, 0), innerStructure);

                return li;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabItem',
            view: (modelElement, { writer: viewWriter }) => {
                const isActive = modelElement.getAttribute('isActive');
                const li = viewWriter.createContainerElement('li', {
                    class: `yui3-tab tablinks${isActive ? ' active' : ''}`,
                    'data-index': modelElement.getAttribute('index'),
                    draggable: 'false',
                });

                const innerStructure = this._createTabItemInnerStructure(
                    viewWriter,
                    modelElement.getAttribute('title'),
                    modelElement.getAttribute('index'),
                    modelElement.parent.childCount,
                    isActive
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
                    draggable: 'false',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    id: modelElement.parent.getAttribute('id') + '-tabContent',
                    draggable: 'false',
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
                    class: `yui3-tab-panel tabcontent${modelElement.getAttribute('isActive') ? ' active' : ''}`,
                    draggable: 'false',
                });
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabPanel',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: `yui3-tab-panel tabcontent${modelElement.getAttribute('isActive') ? ' active' : ''}`,
                    draggable: 'false',
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
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab', draggable: 'false' });
                const div = viewWriter.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                    draggable: 'false',
                });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon', draggable: 'false' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return li;
            },
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab', draggable: 'false' });
                const div = viewWriter.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                    draggable: 'false',
                });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon', draggable: 'false' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return toWidget(li, viewWriter);
            },
        });
    }

    _createTabItemInnerStructure(viewWriter, title, index, totalTabs, isActive) {
        const div = viewWriter.createContainerElement('div', {
            class: `yui3-tab-label${isActive ? ' active' : ''}`,
            draggable: 'false',
        });
        const table = viewWriter.createContainerElement('table', { draggable: 'false' });
        const thead = viewWriter.createContainerElement('thead', { draggable: 'false' });
        const tbody = viewWriter.createContainerElement('tbody', { draggable: 'false' });

        const theadTr = viewWriter.createContainerElement('tr', { draggable: 'false' });
        const thLeft = viewWriter.createContainerElement('th', { draggable: 'false' });
        const thRight = viewWriter.createContainerElement('th', { draggable: 'false' });
        const thDelete = viewWriter.createContainerElement('th', { draggable: 'false' });

        const leftArrow = viewWriter.createContainerElement('div', {
            class: 'left-arrow arrowtabicon' + (index === '0' ? ' disabled' : ''),
            title: 'Move Tab Left',
            draggable: 'false',
        });
        const rightArrow = viewWriter.createContainerElement('div', {
            class: 'right-arrow arrowtabicon' + (index === (totalTabs - 2).toString() ? ' disabled' : ''),
            title: 'Move Tab Right',
            draggable: 'false',
        });
        const deleteIcon = viewWriter.createContainerElement('div', {
            class: 'dropicon',
            title: 'Delete Tab',
            draggable: 'false',
        });
        const deleteP = viewWriter.createContainerElement('p', { class: 'droptab droptabicon', draggable: 'false' });
        viewWriter.insert(viewWriter.createPositionAt(deleteP, 0), viewWriter.createEmptyElement('br'));

        viewWriter.insert(viewWriter.createPositionAt(thLeft, 0), leftArrow);
        viewWriter.insert(viewWriter.createPositionAt(thRight, 0), rightArrow);
        viewWriter.insert(viewWriter.createPositionAt(deleteIcon, 0), deleteP);
        viewWriter.insert(viewWriter.createPositionAt(thDelete, 0), deleteIcon);

        viewWriter.insert(viewWriter.createPositionAt(theadTr, 0), thLeft);
        viewWriter.insert(viewWriter.createPositionAt(theadTr, 1), thRight);
        viewWriter.insert(viewWriter.createPositionAt(theadTr, 2), thDelete);

        const tbodyTr = viewWriter.createContainerElement('tr', { draggable: 'false' });
        const tbodyTd = viewWriter.createContainerElement('td', { colspan: '5', draggable: 'false' });
        const titleDiv = viewWriter.createContainerElement('div', { class: 'tabTitle', draggable: 'false' });
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
                let tabCount = 2; // Default tab count

                if (this.showTabCountPrompt) {
                    const userInput = prompt('Enter the number of tabs:', '2');
                    if (userInput !== null) {
                        tabCount = parseInt(userInput, 10);
                    } else {
                        return; // Exit if user cancels the prompt
                    }
                }

                editor.execute('tabsPlugin', { tabCount: tabCount });
            });

            return button;
        });
    }

    _setupEventListeners() {
        this.editor.editing.view.document.on('click', (evt, data) => {
            if (data.domEvent.target.classList.contains('addtabicon')) {
                this.editor.execute('addTab');
                evt.stop();
            } else if (data.domEvent.target.classList.contains('left-arrow')) {
                this.editor.execute('moveTab', { direction: 'left' });
                evt.stop();
            } else if (data.domEvent.target.classList.contains('right-arrow')) {
                this.editor.execute('moveTab', { direction: 'right' });
                evt.stop();
            } else if (data.domEvent.target.classList.contains('droptabicon')) {
                this.editor.execute('deleteTab');
                evt.stop();
            }
        });
    }

    togglePrompt() {
        this.showTabCountPrompt = !this.showTabCountPrompt;
    }
}

class InsertTabsCommand extends Command {
    execute(options = {}) {
        const editor = this.editor;
        const tabCount = options.tabCount || 2;

        editor.model.change((writer) => {
            const tabsPlugin = writer.createElement('tabsPlugin');
            const tabsContainerDiv = writer.createElement('tabsContainerDiv');
            const tabHeader = writer.createElement('tabHeader');
            const tabList = writer.createElement('tabList');
            const tabContent = writer.createElement('tabContent');

            writer.append(tabsContainerDiv, tabsPlugin);
            writer.append(tabHeader, tabsContainerDiv);
            writer.append(tabList, tabHeader);
            writer.append(tabContent, tabsPlugin);

            for (let i = 1; i <= tabCount; i++) {
                const tabItem = writer.createElement('tabItem', {
                    title: `Tab Name ${i}`,
                    index: i - 1,
                    isActive: i === 1,
                });
                const tabPanel = writer.createElement('tabPanel', {
                    isActive: i === 1,
                });
                writer.append(writer.createText(`Tab Content ${i}`), tabPanel);

                writer.append(tabItem, tabList);
                writer.append(tabPanel, tabContent);
            }

            const addTabButton = writer.createElement('addTabButton');
            writer.append(addTabButton, tabList);

            editor.model.insertContent(tabsPlugin);
        });
    }
}

class AddTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabsPlugin = selection.getFirstPosition().findAncestor('tabsPlugin');

            if (tabsPlugin) {
                const tabList = tabsPlugin.getChild(0)?.getChild(0)?.getChild(0);
                const tabContent = tabsPlugin.getChild(1);

                if (tabList && tabContent) {
                    const newIndex = tabList.childCount - 1;

                    // Set all existing tabs to inactive
                    for (const tabItem of tabList.getChildren()) {
                        if (tabItem.name === 'tabItem') {
                            writer.setAttribute('isActive', false, tabItem);
                        }
                    }
                    for (const tabPanel of tabContent.getChildren()) {
                        writer.setAttribute('isActive', false, tabPanel);
                    }

                    const tabItem = writer.createElement('tabItem', {
                        title: `New Tab`,
                        index: newIndex,
                        isActive: true,
                    });
                    const tabPanel = writer.createElement('tabPanel', {
                        isActive: true,
                    });
                    writer.append(writer.createText(`New Tab Content`), tabPanel);

                    writer.insert(tabItem, tabList, newIndex);
                    writer.append(tabPanel, tabContent);

                    this._updateTabIndices(writer, tabList);
                }
            }
        });
    }

    _updateTabIndices(writer, tabList) {
        let index = 0;
        for (const tabItem of tabList.getChildren()) {
            if (tabItem.name === 'tabItem') {
                writer.setAttribute('index', index, tabItem);
                index++;
            }
        }
    }
}

class MoveTabCommand extends Command {
    execute(options) {
        const { direction } = options;
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabItem = selection.getFirstPosition().findAncestor('tabItem');
            if (!tabItem) return;

            const tabList = tabItem.parent;
            if (!tabList) return;

            const index = tabList.getChildIndex(tabItem);
            const newIndex = direction === 'left' ? index - 1 : index + 1;

            if (newIndex >= 0 && newIndex < tabList.childCount - 1) {
                writer.move(writer.createRangeOn(tabItem), tabList, newIndex);
                this._updateTabIndices(writer, tabList);
            }
        });
    }

    _updateTabIndices(writer, tabList) {
        let index = 0;
        for (const tabItem of tabList.getChildren()) {
            if (tabItem.name === 'tabItem') {
                writer.setAttribute('index', index, tabItem);
                index++;
            }
        }
    }
}

class DeleteTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabItem = selection.getFirstPosition().findAncestor('tabItem');
            if (!tabItem) return;

            const tabList = tabItem.parent;
            if (!tabList) return;

            const tabsPlugin = tabList.parent?.parent?.parent;
            if (!tabsPlugin) return;

            const tabContent = tabsPlugin.getChild(1);
            if (!tabContent) return;

            const index = tabList.getChildIndex(tabItem);
            writer.remove(tabItem);

            const tabPanelToRemove = tabContent.getChild(index);
            if (tabPanelToRemove) {
                writer.remove(tabPanelToRemove);
            }

            this._updateTabIndices(writer, tabList);

            // Activate the previous tab or the first tab if the deleted tab was the first one
            if (index > 0) {
                const prevTab = tabList.getChild(index - 1);
                const prevContent = tabContent.getChild(index - 1);
                if (prevTab) {
                    writer.setAttribute('isActive', true, prevTab);
                    this._setAllOtherTabsInactive(writer, tabList, prevTab);
                }
                if (prevContent) writer.setAttribute('isActive', true, prevContent);
            } else if (tabList.childCount > 1) {
                const firstTab = tabList.getChild(0);
                const firstContent = tabContent.getChild(0);
                if (firstTab) {
                    writer.setAttribute('isActive', true, firstTab);
                    this._setAllOtherTabsInactive(writer, tabList, firstTab);
                }
                if (firstContent) writer.setAttribute('isActive', true, firstContent);
            }
        });
    }

    _updateTabIndices(writer, tabList) {
        let index = 0;
        for (const tabItem of tabList.getChildren()) {
            if (tabItem.name === 'tabItem') {
                writer.setAttribute('index', index, tabItem);
                index++;
            }
        }
    }

    _setAllOtherTabsInactive(writer, tabList, activeTab) {
        for (const tabItem of tabList.getChildren()) {
            if (tabItem.name === 'tabItem' && tabItem !== activeTab) {
                writer.setAttribute('isActive', false, tabItem);
            }
        }
    }
}
