import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { createTabsPluginElement, createTabElement, findAllDescendants } from './tabs-plugin-utils';
import { generateTabId } from './tabs-plugin-command';
import './styles/tabs-plugin.css';

export default class TabsPluginUI extends Plugin {
    init() {
        const editor = this.editor;
        this._insertTabsPlugin(editor);
        this._registerEventHandlers(editor);
    }

    // Inserts the tabs plugin button into the editor's UI
    _insertTabsPlugin(editor) {
        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const button = new ButtonView(locale);
            button.set({
                icon: '<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23.1 1.6c-.2-.2-.5-.4-.8-.5-.3-.1-.6-.2-1-.2h-18.5c-.4 0-.7.1-1 .2-.4.1-.6.3-.9.5-.5.5-.9 1.3-.9 2.1v16.6c0 1.5 1.2 2.8 2.8 2.8h18.5c1.5 0 2.8-1.2 2.8-2.8v-16.6c-.1-.8-.5-1.6-1-2.1zm-9.3 1.2c.5 0 .9.4.9.9v3.7h-5.5v-3.7c0-.5.4-.9.9-.9zm8.4 17.5c0 .5-.4.9-.9.9h-18.5c-.5 0-.9-.4-.9-.9v-16.6c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v5.5h14.8zm-5.6-12.9v-3.7c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v3.7z" fill="#3448c5"/></svg>',
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
            });
            button.on('execute', () => {
                editor.model.change((writer) => {
                    const tabsPluginElement = createTabsPluginElement(writer);
                    editor.model.insertContent(tabsPluginElement, editor.model.document.selection.getFirstPosition());
                });
            });
            return button;
        });
    }

    // Registers event handlers for the tabs plugin
    _registerEventHandlers(editor) {
        editor.editing.view.document.on('click', (evt, data) => {
            const target = data.target;
            if (target.hasClass('tab-list-item') || target.hasClass('tab-title')) {
                this._handleTabClick(editor, target, evt);
            } else if (target.hasClass('delete-tab-button')) {
                this._handleDeleteTab(editor, target, evt);
            } else if (target.hasClass('add-tab-button')) {
                this._handleAddTab(editor, evt);
            } else if (target.hasClass('move-left-button')) {
                this._handleMoveTab(editor, target, evt, -1);
            } else if (target.hasClass('move-right-button')) {
                this._handleMoveTab(editor, target, evt, 1);
            }
        });

        editor.model.document.on('change:data', () => {
            this._updateEmptyTabTitles(editor);
        });
    }

    // Updates empty tab titles with a default value
    _updateEmptyTabTitles(editor) {
        const viewRoot = editor.editing.view.document.getRoot();
        const tabList = Array.from(viewRoot.getChildren()).find(
            (child) => child.is('element', 'ul') && child.hasClass('tab-list')
        );

        if (tabList) {
            const tabTitleElements = Array.from(tabList.getChildren()).filter(
                (child) => child.is('element', 'li') && child.hasClass('tab-list-item')
            );

            for (const tabTitleElement of tabTitleElements) {
                const inputElement = tabTitleElement.getChild(1).getChild(0);
                if (inputElement && inputElement.is('element', 'input') && inputElement.hasClass('tab-title')) {
                    const text = inputElement.getAttribute('value').trim();
                    if (text === '') {
                        inputElement.setAttribute('value', 'Tab Name');
                    }
                }
            }
        }
    }

    // Handles the tab click event
    _handleTabClick(editor, target, evt) {
        let tabListItem = target;

        while (tabListItem && !tabListItem.hasClass('tab-list-item')) {
            tabListItem = tabListItem.parent;
        }

        if (tabListItem) {
            this._activateTab(editor, tabListItem);
        }

        evt.stop();
    }

    // Activates the specified tab
    _activateTab(editor, tabListItem) {
        const tabId = tabListItem.getAttribute('data-target');
        const viewRoot = editor.editing.view.document.getRoot();
        const tabsRootElement = Array.from(viewRoot.getChildren()).find(
            (child) => child.is('element', 'div') && child.hasClass('tabs-plugin')
        );

        if (!tabsRootElement) {
            console.error('Tabs root element not found');
            return;
        }

        const tabListElement = Array.from(tabsRootElement.getChildren()).find(
            (child) => child.is('element', 'ul') && child.hasClass('tab-list')
        );
        const tabContentElement = Array.from(tabsRootElement.getChildren()).find(
            (child) => child.is('element', 'div') && child.hasClass('tab-content')
        );

        if (!tabListElement || !tabContentElement) {
            console.error('Tab list or content element not found');
            return;
        }

        editor.editing.view.change((writer) => {
            // Remove the 'active' class from all tab list items and tab content elements
            for (const item of tabListElement.getChildren()) {
                writer.removeClass('active', item);
            }
            for (const content of tabContentElement.getChildren()) {
                writer.removeClass('active', content);
            }

            // Add the 'active' class to the selected tab list item and corresponding tab content element
            writer.addClass('active', tabListItem);
            const selectedTabContent = Array.from(tabContentElement.getChildren()).find(
                (child) => child.getAttribute('id') === tabId.slice(1)
            );
            if (selectedTabContent) {
                writer.addClass('active', selectedTabContent);
            } else {
                console.error('Selected tab content not found');
            }
        });
    }

    // Handles the delete tab button click event
    _handleDeleteTab(editor, target, evt) {
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const wasActive = tabListItem.hasClass('active');

        editor.model.change((writer) => {
            editor.execute('deleteTab', tabId);

            if (wasActive) {
                const tabList = tabListItem.parent;
                const tabListItems = Array.from(tabList.getChildren()).filter(
                    (child) => child.is('element', 'li') && child.hasClass('tab-list-item')
                );
                const index = tabListItems.indexOf(tabListItem);

                // Find the next tab to activate
                const nextTab = tabListItems[index - 1] || tabListItems[index + 1];
                if (nextTab) {
                    this._activateTab(editor, nextTab);
                }
            }
        });

        evt.stop();
    }

    // Handles the add tab button click event
    _handleAddTab(editor, evt) {
        this._addNewTab(editor);
        evt.stop();
    }

    // Handles the move tab button click event
    _handleMoveTab(editor, target, evt, direction) {
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const wasActive = tabListItem.hasClass('active');

        editor.model.change((writer) => {
            editor.execute('moveTab', { tabId, direction });

            if (wasActive) {
                const tabList = tabListItem.parent;
                const tabListItems = Array.from(tabList.getChildren()).filter(
                    (child) => child.is('element', 'li') && child.hasClass('tab-list-item')
                );
                const movedTabListItem = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);

                if (movedTabListItem) {
                    this._activateTab(editor, movedTabListItem);
                }
            }
        });

        evt.stop();
    }

    // Adds a new tab to the tabs plugin
    _addNewTab(editor) {
        editor.model.change((writer) => {
            // Get the root element of the document
            const root = editor.model.document.getRoot();

            // Find tabsPlugin, tabList, and tabContent by querying for them directly
            let tabsPlugin = null;
            let tabList = null;
            let tabContent = null;

            // Search for the tabsPlugin element
            for (const node of root.getChildren()) {
                if (node.is('element', 'tabsPlugin')) {
                    tabsPlugin = node;
                    break;
                }
            }

            // If tabsPlugin is not found, create it and append to the root
            if (!tabsPlugin) {
                tabsPlugin = writer.createElement('tabsPlugin');
                writer.append(tabsPlugin, root);
            }

            // Within tabsPlugin, find or create tabList and tabContent
            for (const node of tabsPlugin.getChildren()) {
                if (node.is('element', 'tabList')) {
                    tabList = node;
                } else if (node.is('element', 'tabContent')) {
                    tabContent = node;
                }
            }

            if (!tabList) {
                tabList = writer.createElement('tabList');
                writer.append(tabList, tabsPlugin);
            }
            if (!tabContent) {
                tabContent = writer.createElement('tabContent');
                writer.append(tabContent, tabsPlugin);
            }

            // Generate a unique tabId for the new tab using centralized method
            const newTabId = generateTabId();
            // Use the utility function to create a new tab list item and content
            const { tabListItem, tabNestedContent } = createTabElement(writer, newTabId);
            // Find the "Add Tab" button in the tabList
            const addTabButton = tabList.getChild(tabList.childCount - 1);
            // Insert the new tab list item before the "Add Tab" button
            writer.insert(tabListItem, addTabButton, 'before');
            // Append the new tab content to the tabContent
            writer.append(tabNestedContent, tabContent);
        });
    }
}
