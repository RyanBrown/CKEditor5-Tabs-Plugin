import { Command } from '@ckeditor/ckeditor5-core';
import {
    createTabsPluginElement,
    createTabElement,
    generateId,
    findAllDescendants,
    _activateTab,
} from './tabs-plugin-utils';

export default class TabsPluginCommand extends Command {
    execute() {
        const model = this.editor.model;
        const selection = model.document.selection;

        // Check if the current selection is inside a tabsPlugin
        const isInsideTabsPlugin = selection.getFirstPosition().findAncestor('tabsPlugin');

        if (!isInsideTabsPlugin) {
            model.change((writer) => {
                const tabsPlugin = createTabsPlugin(writer);
                model.insertContent(tabsPlugin);
                console.log('TabsPlugin inserted:', tabsPlugin);
            });
        } else {
            console.log('Cannot insert TabsPlugin inside another TabsPlugin');
        }

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
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');
        const isInsideTabsPlugin = selection.getFirstPosition().findAncestor('tabsPlugin');

        this.isEnabled = allowedIn !== null && !isInsideTabsPlugin;
    }
}

// Command to move a tab left or right
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

// Command to delete a tab
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
