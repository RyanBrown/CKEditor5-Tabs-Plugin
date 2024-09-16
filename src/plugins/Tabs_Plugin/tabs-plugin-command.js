import { Command } from '@ckeditor/ckeditor5-core';
import { generateId, createTabsPlugin, ensureActiveTab, findAllDescendants } from './tabs-plugin-utils';

// Command for inserting the tabs plugin
export default class TabsPluginCommand extends Command {
    execute() {
        // Make a change to the editor model
        this.editor.model.change((writer) => {
            // Generate a unique ID for the plugin instance to ensure uniqueness
            const uniqueId = generateId('plugin-id');
            // Create the tabs plugin element with the generated unique ID
            const tabsPlugin = createTabsPlugin(writer, uniqueId);
            // Insert the tabs plugin element into the editor at the current selection position
            this.editor.model.insertContent(tabsPlugin);
            // Ensure the first tab is set as active by default after insertion
            ensureActiveTab(writer, this.editor.model); // ACTIVE_CLASS_ADDED: Applying 'active' class to the first tab
        });
    }

    // This method updates the state of the command (enabled/disabled) based on the current selection
    refresh() {
        const selection = this.editor.model.document.selection;
        // The command is enabled if the selection is in a context where 'tabsPlugin' is allowed
        this.isEnabled = !!this.editor.model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');
    }
}

// Command for moving a tab left or right
export class MoveTabCommand extends Command {
    // Execute the move tab command with the provided tab ID and direction (left or right)
    execute({ tabId, direction }) {
        this.editor.model.change((writer) => {
            // Get the root of the document model (the top-level element of the editor)
            const tabsRoot = this.editor.model.document.getRoot();
            // Find the tab list item and corresponding tab content
            const tabListItem = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabListItem') && node.getAttribute('data-target') === `#${tabId}`
            )[0];
            const tabContent = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            )[0];

            if (!tabListItem || !tabContent) {
                console.warn(`MoveTabCommand: Tab or content not found for ID ${tabId}`);
                return;
            }
            // Determine whether to move before or after the sibling based on direction (-1 for left, 1 for right)
            const moveBefore = direction === -1;
            const moveAfter = direction === 1;

            // Get the previous or next sibling of the tab list item and tab content
            const siblingTabListItem = moveBefore ? tabListItem.previousSibling : tabListItem.nextSibling;
            const siblingTabContent = moveBefore ? tabContent.previousSibling : tabContent.nextSibling;

            // Check if there is a valid sibling to move the tab
            if (siblingTabListItem && siblingTabContent) {
                // Move the tab list item and the tab content relative to their sibling
                if (moveBefore) {
                    writer.move(writer.createRangeOn(tabListItem), writer.createPositionBefore(siblingTabListItem));
                    writer.move(writer.createRangeOn(tabContent), writer.createPositionBefore(siblingTabContent));
                } else if (moveAfter) {
                    // Move the corresponding tab content to the new position
                    writer.move(writer.createRangeOn(tabListItem), writer.createPositionAfter(siblingTabListItem));
                    writer.move(writer.createRangeOn(tabContent), writer.createPositionAfter(siblingTabContent));
                }
            } else {
                console.warn(`MoveTabCommand: Cannot move tab ${tabId} further ${moveBefore ? 'left' : 'right'}`);
            }
        });
    }
}

// Command for deleting a tab
export class DeleteTabCommand extends Command {
    // Execute the delete tab command with the provided tab ID
    execute({ tabId }) {
        const model = this.editor.model;
        // Change the editor model to reflect the deletion
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();

            // Find the specific tabsPlugin instance that contains the tab to delete
            const tabsPlugin = findAllDescendants(tabsRoot, (node) => {
                if (node.is('element', 'tabsPlugin')) {
                    // Check if the tabsPlugin contains the tab with the provided ID
                    const containerDiv = node.getChild(0);
                    const tabHeader = containerDiv.getChild(0);
                    const tabList = tabHeader.getChild(0);
                    const tabListItems = Array.from(tabList.getChildren()).filter((child) =>
                        child.is('element', 'tabListItem')
                    );
                    return tabListItems.some((item) => item.getAttribute('data-target') === `#${tabId}`);
                }
                return false;
            })[0]; // Select the first matching tabsPlugin instance

            // If the tabsPlugin containing the tab is not found, log an error and exit
            if (!tabsPlugin) {
                console.error(`DeleteTabCommand: TabsPlugin containing tab ${tabId} not found`);
                return;
            }
            // Retrieve the container div, tab list, and tab content for the selected tabsPlugin
            const containerDiv = tabsPlugin.getChild(0);
            const tabHeader = containerDiv.getChild(0);
            const tabList = tabHeader.getChild(0);
            const tabContent = containerDiv.getChild(1);
            const tabListItems = Array.from(tabList.getChildren()).filter((node) => node.is('element', 'tabListItem'));
            const tabContents = Array.from(tabContent.getChildren()).filter((node) =>
                node.is('element', 'tabNestedContent')
            );

            // If only one tab is remaining, remove the entire tabsPlugin component
            if (tabListItems.length <= 1) {
                writer.remove(tabsPlugin);
                return;
            }

            // Find the specific tab list item and tab content to delete
            const itemToDelete = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToDelete = tabContents.find((content) => content.getAttribute('id') === tabId);

            // Remove the tab and its corresponding content if both are found
            if (itemToDelete && contentToDelete) {
                writer.remove(itemToDelete); // Remove the tab list item
                writer.remove(contentToDelete); // Remove the corresponding tab content
            } else {
                // Log an error if the tab or its content is not found
                console.error(`DeleteTabCommand: Tab or content not found for ID ${tabId}`);
            }
        });
    }
}
