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
        this.editor.commands.add('activateTab', new ActivateTabCommand(this.editor));

        this._addToolbarButton();
        this._setupEventListeners();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('tabsPlugin', {
            isObject: true,
            allowWhere: '$block',
        });

        schema.register('tabContainerDiv', {
            isObject: true,
            allowIn: 'tabsPlugin',
        });

        schema.register('tabHeader', {
            isObject: true,
            allowIn: 'tabContainerDiv',
        });

        schema.register('tabList', {
            isObject: true,
            allowIn: 'tabHeader',
        });

        schema.register('tabItem', {
            isObject: true,
            allowIn: 'tabList',
            allowAttributes: ['title', 'index', 'isActive'],
        });

        schema.register('addTabButton', {
            isObject: true,
            allowIn: 'tabList',
        });

        schema.register('tabContent', {
            isLimit: true,
            allowIn: 'tabContainerDiv',
            allowContentOf: '$block',
        });

        schema.register('tabNestedContent', {
            isObject: true,
            allowIn: 'tabNestedContent',
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Tabs container
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: ['tabcontainer', 'yui3-widget'] },
            converterPriority: 'high',
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
            converterPriority: 'high',
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
            converterPriority: 'high',
        });

        // Tabs inner container
        conversion.for('upcast').elementToElement({
            model: 'tabContainerDiv',
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
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContainerDiv',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContainerDiv',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                });
            },
            converterPriority: 'high',
        });

        // Tab header
        conversion.for('upcast').elementToElement({
            model: 'tabHeader',
            view: {
                name: 'div',
                classes: ['tabheader', 'ah-tabs-horizontal'],
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                });
            },
            converterPriority: 'high',
        });

        // Tab list
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: {
                name: 'ul',
                classes: ['tab', 'yui3-tabview-list'],
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.parent.parent.getAttribute('id') + '-tabList',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    id: modelElement.parent.parent.parent.getAttribute('id') + '-tabList',
                });
            },
            converterPriority: 'high',
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
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabItem',
            view: (modelElement, { writer: viewWriter }) => {
                const isActive = modelElement.getAttribute('isActive');
                const li = viewWriter.createContainerElement('li', {
                    class: `yui3-tab tablinks${isActive ? ' active' : ''}`,
                    'data-index': modelElement.getAttribute('index'),
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
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabItem',
            view: (modelElement, { writer: viewWriter }) => {
                const isActive = modelElement.getAttribute('isActive');
                const li = viewWriter.createContainerElement('li', {
                    class: `yui3-tab tablinks${isActive ? ' active' : ''}`,
                    'data-index': modelElement.getAttribute('index'),
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
            converterPriority: 'high',
        });

        // Tab panel
        conversion.for('upcast').elementToElement({
            model: (viewElement, { writer }) => {
                return writer.createElement('tabContent', {
                    isActive: viewElement.hasClass('active'),
                });
            },
            view: {
                name: 'div',
                classes: ['yui3-tab-panel', 'tabNestedContent'],
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: `yui3-tab-panel tabNestedContent${modelElement.getAttribute('isActive') ? ' active' : ''}`,
                });
                return div;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: `yui3-tab-panel tabNestedContent${modelElement.getAttribute('isActive') ? ' active' : ''}`,
                });
                return toWidgetEditable(div, viewWriter);
            },
            converterPriority: 'high',
        });

        // Tab content
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: {
                name: 'div',
                classes: 'yui3-tabview-panel',
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    id: modelElement.parent.getAttribute('id') + '-tabNestedContent',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    id: modelElement.parent.getAttribute('id') + '-tabNestedContent',
                });
            },
            converterPriority: 'high',
        });

        // Add Tab Button
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: {
                name: 'li',
                classes: ['yui3-tab', 'addtab'],
            },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab' });
                const div = viewWriter.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return li;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer: viewWriter }) => {
                const li = viewWriter.createContainerElement('li', { class: 'yui3-tab addtab' });
                const div = viewWriter.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                });
                const p = viewWriter.createContainerElement('p', { class: 'addtabicon' });
                viewWriter.insert(viewWriter.createPositionAt(div, 0), p);
                viewWriter.insert(viewWriter.createPositionAt(li, 0), div);
                return li;
            },
            converterPriority: 'high',
        });
    }

    _createTabItemInnerStructure(viewWriter, title, index, totalTabs, isActive) {
        const div = viewWriter.createContainerElement('div', {
            class: `yui3-tab-label${isActive ? ' active' : ''}`,
        });
        const table = viewWriter.createContainerElement('table');
        const thead = viewWriter.createContainerElement('thead');
        const tbody = viewWriter.createContainerElement('tbody');

        const theadTr = viewWriter.createContainerElement('tr');
        const thLeft = viewWriter.createContainerElement('th');
        const thRight = viewWriter.createContainerElement('th');
        const thDelete = viewWriter.createContainerElement('th');

        const leftArrow = viewWriter.createContainerElement('div', {
            class: `left-arrow arrowtabicon${index === 0 ? ' disabled' : ''}`,
            title: 'Move Tab Left',
        });
        const rightArrow = viewWriter.createContainerElement('div', {
            class: `right-arrow arrowtabicon${index === totalTabs - 2 ? ' disabled' : ''}`,
            title: 'Move Tab Right',
        });
        const deleteIcon = viewWriter.createContainerElement('div', {
            class: 'dropicon',
            title: 'Delete Tab',
        });
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
                const tabItem = data.domEvent.target.closest('.yui3-tab');
                const index = parseInt(tabItem.getAttribute('data-index'), 10);
                this.editor.execute('moveTab', { direction: 'left', index });
                evt.stop();
            } else if (data.domEvent.target.classList.contains('right-arrow')) {
                const tabItem = data.domEvent.target.closest('.yui3-tab');
                const index = parseInt(tabItem.getAttribute('data-index'), 10);
                this.editor.execute('moveTab', { direction: 'right', index });
                evt.stop();
            } else if (data.domEvent.target.classList.contains('droptabicon')) {
                const tabItem = data.domEvent.target.closest('.yui3-tab');
                const index = parseInt(tabItem.getAttribute('data-index'), 10);
                this.editor.execute('deleteTab', { index });
                evt.stop();
            } else if (data.domEvent.target.closest('.yui3-tab')) {
                const tabItem = data.domEvent.target.closest('.yui3-tab');
                const index = parseInt(tabItem.getAttribute('data-index'), 10);
                this.editor.execute('activateTab', { index });
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
            const tabContainerDiv = writer.createElement('tabContainerDiv');
            const tabHeader = writer.createElement('tabHeader');
            const tabList = writer.createElement('tabList');
            const tabNestedContent = writer.createElement('tabNestedContent');

            writer.append(tabContainerDiv, tabsPlugin);
            writer.append(tabHeader, tabContainerDiv);
            writer.append(tabList, tabHeader);
            writer.append(tabNestedContent, tabsPlugin);

            for (let i = 1; i <= tabCount; i++) {
                const tabItem = writer.createElement('tabItem', {
                    title: `Tab Name ${i}`,
                    index: i - 1,
                    isActive: i === 1,
                });
                const tabContent = writer.createElement('tabContent', {
                    isActive: i === 1,
                });
                writer.append(writer.createText(`Tab Content ${i}`), tabContent);

                writer.append(tabItem, tabList);
                writer.append(tabContent, tabNestedContent);
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
                const tabNestedContent = tabsPlugin.getChild(1);

                if (tabList && tabNestedContent) {
                    const newIndex = tabList.childCount - 1;

                    // Set all existing tabs to inactive
                    for (const tabItem of tabList.getChildren()) {
                        if (tabItem.name === 'tabItem') {
                            writer.setAttribute('isActive', false, tabItem);
                        }
                    }
                    for (const tabContent of tabNestedContent.getChildren()) {
                        writer.setAttribute('isActive', false, tabContent);
                    }

                    const tabItem = writer.createElement('tabItem', {
                        title: `New Tab`,
                        index: newIndex,
                        isActive: true,
                    });
                    const tabContent = writer.createElement('tabContent', {
                        isActive: true,
                    });
                    writer.append(writer.createText(`New Tab Content`), tabContent);

                    writer.insert(tabItem, tabList, newIndex);
                    writer.append(tabContent, tabNestedContent);

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
        const { direction, index } = options;
        const editor = this.editor;

        editor.model.change((writer) => {
            const tabsPlugin = editor.model.document.getRoot().getChild(0);
            const tabList = tabsPlugin.getChild(0).getChild(0).getChild(0);
            const tabNestedContent = tabsPlugin.getChild(1);

            const currentIndex = index;
            const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

            if (newIndex >= 0 && newIndex < tabList.childCount - 1) {
                const tabToMove = tabList.getChild(currentIndex);
                const contentToMove = tabNestedContent.getChild(currentIndex);

                writer.move(writer.createRangeOn(tabToMove), tabList, newIndex);
                writer.move(writer.createRangeOn(contentToMove), tabNestedContent, newIndex);

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
    execute(options) {
        const { index } = options;
        const editor = this.editor;

        editor.model.change((writer) => {
            const tabsPlugin = editor.model.document.getRoot().getChild(0);
            const tabList = tabsPlugin.getChild(0).getChild(0).getChild(0);
            const tabNestedContent = tabsPlugin.getChild(1);

            const tabToRemove = tabList.getChild(index);
            const contentToRemove = tabNestedContent.getChild(index);

            writer.remove(tabToRemove);
            writer.remove(contentToRemove);

            this._updateTabIndices(writer, tabList);

            // Activate the previous tab or the first tab if the deleted tab was the first one
            if (index > 0) {
                const prevTab = tabList.getChild(index - 1);
                const prevContent = tabNestedContent.getChild(index - 1);
                if (prevTab) {
                    writer.setAttribute('isActive', true, prevTab);
                    this._setAllOtherTabsInactive(writer, tabList, prevTab);
                }
                if (prevContent) writer.setAttribute('isActive', true, prevContent);
            } else if (tabList.childCount > 0) {
                const firstTab = tabList.getChild(0);
                const firstContent = tabNestedContent.getChild(0);
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

class ActivateTabCommand extends Command {
    execute(options) {
        const { index } = options;
        const editor = this.editor;

        editor.model.change((writer) => {
            const tabsPlugin = editor.model.document.getRoot().getChild(0);
            const tabList = tabsPlugin.getChild(0).getChild(0).getChild(0);
            const tabNestedContent = tabsPlugin.getChild(1);

            for (const tabItem of tabList.getChildren()) {
                if (tabItem.name === 'tabItem') {
                    writer.setAttribute('isActive', false, tabItem);
                }
            }

            for (const tabContent of tabNestedContent.getChildren()) {
                writer.setAttribute('isActive', false, tabContent);
            }

            const tabToActivate = tabList.getChild(index);
            const contentToActivate = tabNestedContent.getChild(index);

            if (tabToActivate) {
                writer.setAttribute('isActive', true, tabToActivate);
            }

            if (contentToActivate) {
                writer.setAttribute('isActive', true, contentToActivate);
            }
        });
    }
}
