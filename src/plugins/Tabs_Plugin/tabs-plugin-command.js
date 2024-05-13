import { Command } from '@ckeditor/ckeditor5-core';
import { createTabElement, findAllDescendants } from './tabs-pluign-utils';

export class TabsPluginCommand extends Command {
    execute() {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            const tabId = `tab_${Date.now()}`;
            const { tabListItem, tabNestedContent } = createTabElement(writer, tabId, false);
            const tabsRoot = model.document.getRoot();

            // Find the tabList and tabContent elements within the tabsPlugin
            const tabList = tabsRoot.getChild(0);
            const tabContent = tabsRoot.getChild(1);

            // Find the "Add Tab" button in the tabList
            const addTabButton = tabList.getChild(tabList.childCount - 1);

            // Insert the new tab list item before the "Add Tab" button
            model.insertContent(tabListItem, writer.createPositionBefore(addTabButton));
            // Append the new tab content to the tabContent
            model.append(tabNestedContent, tabContent);

            writer.setSelection(tabListItem.getChild(1).getChild(0), 0);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const tabsPluginElement = model.document.getRoot().getChild(0);
        this.isEnabled = !!tabsPluginElement && model.schema.checkChild(selection.getFirstPosition(), 'tabListItem');
    }
}

// Combined command to move a tab left or right
export class MoveTabCommand extends Command {
    execute(options) {
        const { tabId, direction } = options;
        const model = this.editor.model;

        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabList = tabsRoot.getChild(0); // Assuming the first child is always the tab list
            const tabs = Array.from(tabList.getChildren());
            const currentTabIndex = tabs.findIndex((tab) => tab.getAttribute('data-target') === `#${tabId}`);

            const targetIndex = currentTabIndex + direction;
            // Ensure the target index is within bounds
            if (targetIndex >= 0 && targetIndex < tabs.length) {
                const position = writer.createPositionAt(tabList, targetIndex);
                writer.move(writer.createRangeOn(tabs[currentTabIndex]), position);
            }
        });
    }
}

// Adjusting the RemoveTabCommand to check node types and adding console logs
export class RemoveTabCommand extends Command {
    execute(tabId) {
        // console.log(`Executing RemoveTabCommand for tabId: ${tabId}`);
        const model = this.editor.model;
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            // console.log("Tabs Root: ", tabsRoot); // Log to check state
            console.log(`Tab removed - ${tabId}`);
            if (!tabsRoot) {
                console.error('Tabs root not found.');
                return;
            }
            const tabListItems = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabListItem') && node.getAttribute('data-target') === `#${tabId}`
            );
            const tabContents = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            );

            // console.log("Tab List Items to Remove: ", tabListItems);
            // console.log("Tab Contents to Remove: ", tabContents);

            tabListItems.forEach((item) => writer.remove(item));
            tabContents.forEach((content) => writer.remove(content));
        });
    }
}

// Helper function to get the index of a tab list item by its tabId
function getTabIndex(tabList, tabId) {
    return Array.from(tabList.getChildren()).findIndex((tab) => tab.getAttribute('data-target') === `#${tabId}`);
}

// Helper function to find a tab list item by its tabId
function getTabListItem(root, tabId) {
    return root.getDescendant(
        (node) => node.is('element', 'tabListItem') && node.getAttribute('data-target') === `#${tabId}`
    );
}

// Helper function to find a tab content by its tabId
function getTabContent(root, tabId) {
    return root.getDescendant((node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId);
}
