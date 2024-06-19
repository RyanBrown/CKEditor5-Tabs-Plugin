import { Command } from '@ckeditor/ckeditor5-core';
import { createTabElement, findAllDescendants } from './tabs-plugin-utils';

// Generates a unique tab ID based on the current timestamp.
export function generateTabId() {
    return `tab-id_${Date.now()}`;
}

// Generates a unique Plugin ID.
let pluginCounter = 0;
export function generatePluginId() {
    return `plugin-id_${Date.now()}_${pluginCounter++}`;
}

// Command to insert a new tab in the editor.
export class TabsPluginCommand extends Command {
    execute() {
        const editor = this.editor;
        const model = editor.model;

        // Change the model to insert a new tab
        model.change((writer) => {
            const tabId = generateTabId();
            const { tabListItem, tabNestedContent } = createTabElement(writer, tabId);
            const tabsRoot = model.document.getRoot();
            const tabList = tabsRoot.getChild(0).getChild(1).getChild(0);
            const tabContent = tabsRoot.getChild(0).getChild(2);
            const addTabButton = tabList.getChild(tabList.childCount - 1);

            if (!tabList || !tabContent || !addTabButton) {
                console.error('One or more required elements are null:', { tabList, tabContent, addTabButton });
                return;
            }

            // Insert the new tab list item before the "Add Tab" button
            model.insertContent(tabListItem, writer.createPositionBefore(addTabButton));
            // Append the new tab content to the tab content element
            model.append(tabNestedContent, tabContent);
            // Set the selection to the newly created tab title
            writer.setSelection(tabListItem.getChild(0).getChild(1).getChild(1).getChild(0), 0);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const tabsPluginElement = model.document.getRoot().getChild(0);
        // Enable the command if there is a tabsPlugin element and the selection allows for a tabListItem
        this.isEnabled = !!tabsPluginElement && model.schema.checkChild(selection.getFirstPosition(), 'tabListItem');
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
            const tabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));

            // If only one tab is remaining, remove the entire tabsPlugin component
            if (tabListItems.length <= 1) {
                const tabsPlugin = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabsPlugin'))[0];
                if (tabsPlugin) {
                    writer.remove(tabsPlugin);
                }
                return;
            }

            const itemToDelete = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToDelete = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            )[0];

            // Remove the tab and its content if found
            if (itemToDelete && contentToDelete) {
                writer.remove(itemToDelete);
                writer.remove(contentToDelete);
            } else {
                console.error(`Tab or content not found for ID: ${tabId}`);
            }

            // If only one tab remains, set it to active
            const remainingTabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));
            if (remainingTabListItems.length === 1) {
                const remainingTab = remainingTabListItems[0];
                const remainingTabId = remainingTab.getAttribute('data-target').slice(1);
                const remainingTabContent = findAllDescendants(
                    tabsRoot,
                    (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === remainingTabId
                )[0];

                if (remainingTab && remainingTabContent) {
                    writer.setAttribute('class', 'active', remainingTab);
                    writer.setAttribute('class', 'active', remainingTabContent);
                }
            }
        });
    }
}
