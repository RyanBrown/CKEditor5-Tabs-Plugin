// Generates a unique ID
let counter = 0;
export function generateId(prefix) {
    return `${prefix}_${Date.now()}_${counter++}`;
}

export function createTabsPlugin(writer) {
    const uniqueId = generateId('plugin-id');
    const tabsPlugin = writer.createElement('tabsPlugin', { id: uniqueId });
    const containerDiv = writer.createElement('containerDiv');

    writer.append(containerDiv, tabsPlugin);

    const tabHeader = writer.createElement('tabHeader');
    writer.append(tabHeader, containerDiv);

    const tabList = writer.createElement('tabList');
    writer.append(tabList, tabHeader);

    const tabListItem = createTabListItem(writer, uniqueId, true);
    writer.append(tabListItem, tabList);

    const tabContent = writer.createElement('tabContent');
    writer.append(tabContent, containerDiv);

    const tabNestedContent = createTabNestedContent(writer, uniqueId, true);
    writer.append(tabNestedContent, tabContent);

    return tabsPlugin;
}

export function createTabListItem(writer, tabContainerId, isActive = false) {
    const tabListItem = writer.createElement('tabListItem');
    const uniqueId = generateId('tab-list-item');
    const dataTarget = `#${uniqueId}`;
    writer.setAttribute('data-target', dataTarget, tabListItem);
    writer.setAttribute('id', uniqueId, tabListItem);
    writer.setAttribute('data-plugin-id', tabContainerId, tabListItem);

    const classNames = ['yui3-tab', 'tablinks'];
    if (isActive) {
        classNames.push('active');
    }
    writer.setAttribute('class', classNames.join(' '), tabListItem);

    const tabListItemLabelDiv = writer.createElement('tabListItemLabelDiv');
    writer.append(tabListItemLabelDiv, tabListItem);

    const tabListTable = writer.createElement('tabListTable');
    writer.append(tabListTable, tabListItemLabelDiv);

    const tabTitle = writer.createElement('tabTitle');
    writer.appendText('Tab 1', tabTitle);
    writer.append(tabTitle, tabListTable);

    return tabListItem;
}

export function createTabNestedContent(writer, tabContainerId, isActive = false) {
    const tabNestedContent = writer.createElement('tabNestedContent');
    const uniqueId = generateId('tab-nested-content');
    writer.setAttribute('id', uniqueId, tabNestedContent);
    writer.setAttribute('data-plugin-id', tabContainerId, tabNestedContent);

    const classNames = ['yui3-tab-panel', 'tabcontent'];
    if (isActive) {
        classNames.push('active');
    }
    writer.setAttribute('class', classNames.join(' '), tabNestedContent);

    const paragraph = writer.createElement('paragraph');
    writer.appendText('Tab content goes here', paragraph);
    writer.append(paragraph, tabNestedContent);

    return tabNestedContent;
}
