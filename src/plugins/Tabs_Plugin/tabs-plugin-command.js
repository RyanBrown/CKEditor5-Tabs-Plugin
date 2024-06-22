import { Command } from '@ckeditor/ckeditor5-core';
import { generateId } from './tabs-plugin-utils';

export default class TabsPluginCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            const tabsPlugin = createTabsPlugin(writer);
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');

        this.isEnabled = allowedIn !== null;
    }
}

function createTabsPlugin(writer) {
    const uniqueId = generateId('plugin-id');
    const tabsPlugin = writer.createElement('tabsPlugin', { id: uniqueId });
    const containerDiv = writer.createElement('containerDiv');

    writer.append(containerDiv, tabsPlugin);

    // Create tabHeader
    const tabHeader = writer.createElement('tabHeader');
    writer.append(tabHeader, containerDiv);

    // Create tabList
    const tabList = writer.createElement('tabList');
    writer.append(tabList, tabHeader);

    // Create initial tabListItem
    const tabListItem = createTabListItem(writer, uniqueId);
    writer.append(tabListItem, tabList);

    // Create tabContent
    const tabContent = writer.createElement('tabContent');
    writer.append(tabContent, containerDiv);

    // Create initial tabNestedContent
    const tabNestedContent = createTabNestedContent(writer, uniqueId);
    writer.append(tabNestedContent, tabContent);

    return tabsPlugin;
}

function createTabListItem(writer, tabContainerId) {
    const tabListItem = writer.createElement('tabListItem');
    const dataTarget = `#${tabContainerId}-tab-0`;
    writer.setAttribute('data-target', dataTarget, tabListItem);
    writer.setAttribute('data-plugin-id', tabContainerId, tabListItem);
    writer.setAttribute('class', 'yui3-tab tablinks active', tabListItem);

    const tabListItemLabelDiv = writer.createElement('tabListItemLabelDiv');
    writer.append(tabListItemLabelDiv, tabListItem);

    const tabListTable = writer.createElement('tabListTable');
    writer.append(tabListTable, tabListItemLabelDiv);

    // Add table structure (thead, tbody, tr, td) here if needed

    const tabTitle = writer.createElement('tabTitle');
    writer.appendText('Tab 1', tabTitle);
    writer.append(tabTitle, tabListTable);

    return tabListItem;
}

function createTabNestedContent(writer, tabContainerId) {
    const tabNestedContent = writer.createElement('tabNestedContent');
    writer.setAttribute('id', `${tabContainerId}-tab-0`, tabNestedContent);
    writer.setAttribute('data-plugin-id', tabContainerId, tabNestedContent);
    writer.setAttribute('class', 'yui3-tab-panel tabcontent active', tabNestedContent);

    const paragraph = writer.createElement('paragraph');
    writer.appendText('Tab content goes here', paragraph);
    writer.append(paragraph, tabNestedContent);

    return tabNestedContent;
}
