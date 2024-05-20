import { Command } from '@ckeditor/ckeditor5-core';
import { createTabElement, findAllDescendants } from './tabs-plugin-utils';

// Generates a unique tab ID based on the current timestamp.
// @returns {string} The generated tab ID.
export function generateTabId() {
    return `id_${Date.now()}`;
}

// Command to insert a new tab into the tabs plugin.
export class TabsPluginCommand extends Command {
    // Executes the command to insert a new tab.
    execute() {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            const tabId = generateTabId();
            const { tabListItem, tabNestedContent } = createTabElement(writer, tabId, false);
            const tabsRoot = model.document.getRoot();
            const tabList = tabsRoot.getChild(0);
            const tabContent = tabsRoot.getChild(1);
            const addTabButton = tabList.getChild(tabList.childCount - 1);

            model.insertContent(tabListItem, writer.createPositionBefore(addTabButton));
            model.append(tabNestedContent, tabContent);

            writer.setSelection(tabListItem.getChild(1).getChild(0), 0);
        });
    }

    // Refreshes the command's state.
    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const tabsPluginElement = model.document.getRoot().getChild(0);
        this.isEnabled = !!tabsPluginElement && model.schema.checkChild(selection.getFirstPosition(), 'tabListItem');
    }
}

// Command to move a tab left or right.
export class MoveTabCommand extends Command {
    // Executes the command to move a tab.
    // @param {Object} options - The command options.
    // @param {string} options.tabId - The ID of the tab to move.
    // @param {number} options.direction - The direction to move the tab (-1 for left, 1 for right).
    execute(options) {
        const { tabId, direction } = options;
        const model = this.editor.model;

        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));

            const currentTabIndex = tabListItems.findIndex((item) => item.getAttribute('data-target') === `#${tabId}`);
            const targetIndex = currentTabIndex + direction;

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
    // Executes the command to delete a tab.
    // @param {string} tabId - The ID of the tab to delete.
    execute(tabId) {
        const model = this.editor.model;
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));

            if (tabListItems.length <= 1) {
                console.log('Cannot delete the last tab.');
                return;
            }

            const itemToDelete = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToDelete = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            )[0];

            if (itemToDelete && contentToDelete) {
                writer.remove(itemToDelete);
                writer.remove(contentToDelete);
            } else {
                console.error(`Tab or content not found for ID: ${tabId}`);
            }
        });
    }
}
