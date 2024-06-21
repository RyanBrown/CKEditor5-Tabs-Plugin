import { Command } from '@ckeditor/ckeditor5-core';
import {
    createTabsPluginElement,
    createTabElement,
    generateId,
    findAllDescendants,
    _activateTab,
} from './tabs-plugin-utils';

export class TabsPluginCommand extends Command {
    execute() {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            const selection = model.document.selection;
            const pluginElement = selection.getFirstPosition().findAncestor('tabsPlugin');

            if (pluginElement) {
                console.error('Cannot insert a tabs plugin inside another tabs plugin.');
                return;
            }

            const uniqueId = generateId('plugin-id');
            const tabsPluginElement = writer.createElement('tabsPlugin', { id: uniqueId });
            const containerDiv = createTabsPluginElement(writer, uniqueId);
            writer.append(containerDiv, tabsPluginElement);
            model.insertContent(tabsPluginElement, model.document.selection);

            writer.setSelection(tabsPluginElement, 'on');
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const pluginElement = selection.getFirstPosition().findAncestor('tabsPlugin');
        this.isEnabled = !pluginElement && model.schema.checkChild(selection.getFirstPosition(), 'tabsPlugin');
    }
}

export class AddTabCommand extends Command {
    execute({ pluginId }) {
        console.log('AddTabCommand executed with pluginId:', pluginId);
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            const root = model.document.getRoot();
            const pluginElement = findAllDescendants(
                root,
                (node) => node.is('element', 'tabsPlugin') && node.getAttribute('id') === pluginId
            )[0];

            if (!pluginElement) {
                console.error(`No tabs plugin found with id="${pluginId}".`);
                return;
            }

            // Find or create tabList and tabContent within the specific plugin instance
            let tabList = null;
            let tabContent = null;

            for (const node of pluginElement.getChildren()) {
                if (node.is('element', 'containerDiv')) {
                    const containerDiv = node;
                    for (const childNode of containerDiv.getChildren()) {
                        if (childNode.is('element', 'tabHeader')) {
                            tabList = childNode.getChild(0);
                        } else if (childNode.is('element', 'tabContent')) {
                            tabContent = childNode;
                        }
                    }
                }
            }

            if (!tabList) {
                const tabHeader = writer.createElement('tabHeader');
                tabList = writer.createElement('tabList');
                writer.append(tabList, tabHeader);
                writer.append(tabHeader, pluginElement.getChild(0));
            }
            if (!tabContent) {
                tabContent = writer.createElement('tabContent');
                writer.append(tabContent, pluginElement.getChild(0));
            }

            // Generate a unique tabId for the new tab using centralized method
            const newTabId = generateId('tab-id');
            // Use the utility function to create a new tab list item and content
            const { tabListItem, tabNestedContent } = createTabElement(writer, pluginId, newTabId);

            // Set necessary attributes for activation
            writer.setAttribute('data-target', `#${newTabId}`, tabListItem);
            writer.setAttribute('data-plugin-id', pluginId, tabListItem);

            // Find the "Add Tab" button in the tabList
            const addTabButton = Array.from(tabList.getChildren()).find((child) =>
                child.is('element', 'addTabListItem')
            );
            if (addTabButton) {
                // Insert the new tab list item before the "Add Tab" button
                writer.insert(tabListItem, writer.createPositionBefore(addTabButton));
            } else {
                // Append the new tab list item to the end of the tabList
                writer.append(tabListItem, tabList);
            }
            // Append the new tab content to the tabContent
            writer.append(tabNestedContent, tabContent);

            // Activate the newly added tab
            _activateTab(editor, tabListItem);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const pluginElement = selection.getFirstPosition().findAncestor('tabsPlugin');
        this.isEnabled = !!pluginElement;
    }
}

// Command to move a tab left or right.
export class MoveTabCommand extends Command {
    execute({ tabId, direction }) {
        const model = this.editor.model;
        model.change((writer) => {
            const selection = model.document.selection;
            const pluginElement = selection.getFirstPosition().findAncestor('tabsPlugin');
            const tabListItems = findAllDescendants(pluginElement, (node) => node.is('element', 'tabListItem'));
            const currentTabIndex = tabListItems.findIndex((item) => item.getAttribute('data-target') === `#${tabId}`);
            const targetIndex = currentTabIndex + direction;

            // Move the tab to the new position if it is within bounds
            if (targetIndex >= 0 && targetIndex < tabListItems.length) {
                writer.move(
                    writer.createRangeOn(tabListItems[currentTabIndex]),
                    writer.createPositionAt(tabListItems[targetIndex], direction === 1 ? 'after' : 'before')
                );
            }
        });
    }
}

// Command to delete a tab.
export class DeleteTabCommand extends Command {
    execute({ tabId, pluginId }) {
        const model = this.editor.model;
        model.change((writer) => {
            const selection = model.document.selection;
            const pluginElement = findAllDescendants(
                model.document.getRoot(),
                (node) => node.is('element', 'tabsPlugin') && node.getAttribute('id') === pluginId
            )[0];

            if (!pluginElement) {
                console.error(`No tabs plugin found with id="${pluginId}".`);
                return;
            }
            const tabListItems = findAllDescendants(pluginElement, (node) => node.is('element', 'tabListItem'));

            if (tabListItems.length === 0) {
                console.error('No tab list items found within the tabs plugin.');
                return;
            }

            // If only one tab is remaining, remove the entire tabsPlugin component
            if (tabListItems.length <= 1) {
                console.log('Removing the entire tabs plugin as there is only one tab remaining.');
                writer.remove(pluginElement);
                return;
            }

            const itemToDelete = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToDelete = findAllDescendants(
                pluginElement,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            )[0];

            if (!itemToDelete) {
                console.error(`Tab list item with data-target="#${tabId}" not found.`);
                return;
            }
            if (!contentToDelete) {
                console.error(`Tab content with id="${tabId}" not found.`);
                return;
            }
            console.log('Removing tab list item:', itemToDelete);
            writer.remove(itemToDelete);

            console.log('Removing tab content item:', contentToDelete);
            writer.remove(contentToDelete);

            // If only one tab remains, set it to active
            const remainingTabListItems = findAllDescendants(pluginElement, (node) =>
                node.is('element', 'tabListItem')
            );
            if (remainingTabListItems.length === 1) {
                const remainingTab = remainingTabListItems[0];
                const remainingTabId = remainingTab.getAttribute('data-target').slice(1);
                const remainingTabContent = findAllDescendants(
                    pluginElement,
                    (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === remainingTabId
                )[0];

                if (remainingTab && remainingTabContent) {
                    console.log('Setting the remaining tab to active:', remainingTab);
                    writer.setAttribute('class', 'active', remainingTab);
                    writer.setAttribute('class', 'active', remainingTabContent);
                } else {
                    console.error('Remaining tab or tab content not found.');
                }
            }
        });
    }
}
