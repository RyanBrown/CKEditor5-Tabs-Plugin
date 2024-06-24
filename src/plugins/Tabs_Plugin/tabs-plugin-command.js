import { Command } from '@ckeditor/ckeditor5-core';
import { generateId, createTabsPlugin, ensureActiveTab, findAllDescendants } from './tabs-plugin-utils';

// Define a command for the tabs plugin
export default class TabsPluginCommand extends Command {
    // Execute the command
    execute() {
        // Make a change to the editor model
        this.editor.model.change((writer) => {
            // Generate a unique ID for the plugin instance
            const uniqueId = generateId('plugin-id');
            // Create the tabs plugin element
            const tabsPlugin = createTabsPlugin(writer, uniqueId);
            // Insert the tabs plugin element into the editor
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
            // Ensure the first tab is active by default
            ensureActiveTab(writer, this.editor.model);
        });
    }

    // Refresh the command state
    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        // Check if the tabsPlugin element is allowed at the current selection position
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');
        this.isEnabled = allowedIn !== null;
    }
}

// Command to move a tab left or right.
export class MoveTabCommand extends Command {
    execute({ tabId, direction }) {
        const model = this.editor.model;
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));
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
    execute(tabId) {
        const model = this.editor.model;
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabsPlugin = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'div') && node.hasClass('tabcontainer')
            )[0];

            if (!tabsPlugin) {
                console.error('TabsPlugin not found');
                return;
            }

            const tabListItems = findAllDescendants(
                tabsPlugin,
                (node) => node.is('element', 'li') && node.hasClass('yui3-tab')
            );
            const tabContents = findAllDescendants(
                tabsPlugin,
                (node) => node.is('element', 'div') && node.hasClass('yui3-tab-panel')
            );

            // If only one tab is remaining, remove the entire tabsPlugin component
            if (tabListItems.length <= 1) {
                writer.remove(tabsPlugin);
                return;
            }

            const itemToDelete = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToDelete = tabContents.find((content) => content.getAttribute('id') === tabId);

            // Remove the tab and its content if found
            if (itemToDelete && contentToDelete) {
                writer.remove(itemToDelete);
                writer.remove(contentToDelete);
            } else {
                console.error(`Tab or content not found for ID: ${tabId}`);
            }

            // If only one tab remains, set it to active
            if (tabListItems.length === 2) {
                const remainingTab = tabListItems.find((item) => item !== itemToDelete);
                const remainingTabId = remainingTab.getAttribute('data-target').slice(1);
                const remainingTabContent = tabContents.find(
                    (content) => content.getAttribute('id') === remainingTabId
                );

                if (remainingTab && remainingTabContent) {
                    writer.addClass('active', remainingTab);
                    writer.addClass('active', remainingTabContent);
                }
            }
        });
    }
}
