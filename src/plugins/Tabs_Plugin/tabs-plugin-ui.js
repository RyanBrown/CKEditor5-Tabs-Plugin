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

    findTabListItem(tabsRoot, tabId) {
        // Utilize findAllDescendants to locate the specific tab list item by attribute
        return findAllDescendants(
            tabsRoot,
            (node) => node.is('element', 'tabListItem') && node.getAttribute('data-target') === `#${tabId}`
        );
    }

    findTabNestedContent(tabsRoot, tabId) {
        // Utilize findAllDescendants to locate the specific tab nested content by ID
        return findAllDescendants(
            tabsRoot,
            (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
        );
    }

    _registerEventHandlers(editor) {
        editor.editing.view.document.on('click', (evt, data) => {
            const target = data.target; // The element that was clicked.
            // Delegating the click events to specific handlers based on the class of the clicked element
            if (target.hasClass('tab-list-item')) {
                this._handleTabActivation(editor, target, evt);
            } else if (target.hasClass('tab-title')) {
                this._handleTabTitleClick(editor, target, evt);
            } else if (target.hasClass('remove-tab-button')) {
                this._handleRemoveTab(editor, target, evt);
            } else if (target.hasClass('move-left-button') || target.hasClass('move-right-button')) {
                this._handleMoveTab(editor, target, evt);
            } else if (target.hasClass('add-tab-button')) {
                this._handleAddTab(editor, evt);
            }
        });
    }

    _handleTabActivation(editor, target, evt) {
        const tabId = target.getAttribute('data-target').slice(1); // Extract tabId from the data-target attribute.
        editor.model.change((writer) => {
            const tabsRoot = editor.model.document.getRoot();

            // Find the tabListItem and tabNestedContent associated with the clicked tab.
            const tabListItem = this.findTabListItem(tabsRoot, tabId)[0];
            const tabNestedContent = this.findTabNestedContent(tabsRoot, tabId)[0];

            // Clear existing active classes before setting new ones.
            this._clearActiveClasses(writer, tabsRoot);

            // Set active class on the clicked tab and its content.
            if (tabListItem) {
                const existingClass = tabListItem.getAttribute('class') || '';
                writer.setAttribute('class', `${existingClass} active`.trim(), tabListItem);
            }
            if (tabNestedContent) {
                const existingClass = tabNestedContent.getAttribute('class') || '';
                writer.setAttribute('class', `${existingClass} active`.trim(), tabNestedContent);
            }
        });
        evt.stop(); // Prevent further propagation of the click event.
    }

    _handleTabTitleClick(editor, target, evt) {
        editor.editing.view.focus(target);
        evt.stop();
    }

    _handleRemoveTab(editor, target, evt) {
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1).replace('#', '');
        editor.execute('removeTab', tabId);
        evt.stop();
    }

    _handleMoveTab(editor, target, evt) {
        const tabListItem = target.findAncestor('tabListItem');
        if (!tabListItem) {
            console.error('Failed to find the tab list item ancestor.');
            evt.stop();
            return; // Stop the function if no tab list item is found
        }

        const tabId = tabListItem.getAttribute('data-target').slice(1);
        if (!tabId) {
            console.error('No tab ID found on the tab list item.');
            evt.stop();
            return; // Stop the function if no tab ID is found
        }

        const direction = target.hasClass('move-left-button') ? -1 : 1;
        editor.execute('moveTab', { tabId: tabId, direction: direction });
        evt.stop();
    }

    _handleAddTab(editor, evt) {
        this._addNewTab(editor);
        evt.stop();
    }

    _clearActiveClasses(writer, tabsRoot) {
        const allTabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));
        const allTabNestedContents = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabNestedContent'));
        allTabListItems.concat(allTabNestedContents).forEach((node) => {
            const currentClasses = node.getAttribute('class') || '';
            const updatedClasses = currentClasses
                .split(' ')
                .filter((cls) => cls !== 'active')
                .join(' ');
            writer.setAttribute('class', updatedClasses, node);
        });
    }

    _setActiveClass(writer, tabListItem, tabNestedContent) {
        if (tabListItem) {
            writer.setAttribute('class', (tabListItem.getAttribute('class') || '') + ' active', tabListItem);
        }
        if (tabNestedContent) {
            writer.setAttribute('class', (tabNestedContent.getAttribute('class') || '') + ' active', tabNestedContent);
        }
    }

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

            // If not found, create them
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
            const { tabListItem, tabNestedContent } = createTabElement(writer, newTabId, false);

            // Find the "Add Tab" button in the tabList
            const addTabButton = tabList.getChild(tabList.childCount - 1);

            // Insert the new tab list item before the "Add Tab" button
            writer.insert(tabListItem, addTabButton, 'before');

            // Append the new tab content to the tabContent
            writer.append(tabNestedContent, tabContent);
        });
    }
}
