import { Command } from '@ckeditor/ckeditor5-core';
import { createTabElement, findAllDescendants } from './tabs-plugin-utils';

function generateTabId() {
    return `tabs-plugin-command_tabId_${Date.now()}`;
}

export class TabsPluginCommand extends Command {
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

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const tabsPluginElement = model.document.getRoot().getChild(0);
        this.isEnabled = !!tabsPluginElement && model.schema.checkChild(selection.getFirstPosition(), 'tabListItem');
    }
}

export class MoveTabCommand extends Command {
    execute(options) {
        const { tabId, direction } = options;
        const model = this.editor.model;

        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabList = tabsRoot.getChild(0);
            const tabs = Array.from(tabList.getChildren());
            const currentTabIndex = tabs.findIndex((tab) => tab.getAttribute('data-target') === `#${tabId}`);

            const targetIndex = currentTabIndex + direction;
            if (targetIndex >= 0 && targetIndex < tabs.length) {
                const position = writer.createPositionAt(tabList, targetIndex);
                writer.move(writer.createRangeOn(tabs[currentTabIndex]), position);
            }
        });
    }
}

export class RemoveTabCommand extends Command {
    execute(tabId) {
        const model = this.editor.model;
        model.change((writer) => {
            const tabsRoot = model.document.getRoot();
            const tabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));

            if (tabListItems.length <= 1) {
                console.log('Cannot remove the last tab.');
                return;
            }

            const itemToRemove = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);
            const contentToRemove = findAllDescendants(
                tabsRoot,
                (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
            )[0];

            if (itemToRemove && contentToRemove) {
                writer.remove(itemToRemove);
                writer.remove(contentToRemove);
            } else {
                console.error(`Tab or content not found for ID: ${tabId}`);
            }
        });
    }
}
