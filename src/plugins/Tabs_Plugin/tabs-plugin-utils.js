import { generateId } from './tabs-plugin-command';

// Create tabs plugin element with two initial tabs
export function createTabsPluginElement(writer, uniqueId) {
    const containerDiv = writer.createElement('containerDiv');
    const tabHeader = writer.createElement('tabHeader');
    const tabList = writer.createElement('tabList');
    const tabContent = writer.createElement('tabContent');

    // Create two initial tabs
    for (let i = 0; i < 2; i++) {
        const tabId = generateId('tab-id');
        const { tabListItem, tabNestedContent } = createTabElement(writer, tabId);
        if (i === 0) {
            writer.setAttribute('class', `${tabListItem.getAttribute('class')} active`, tabListItem);
            writer.setAttribute('class', `${tabNestedContent.getAttribute('class')} active`, tabNestedContent);
        }
        writer.append(tabListItem, tabList);
        writer.append(tabNestedContent, tabContent);
    }

    // Add the 'Add Tab' button to the tabList as the last item
    writer.append(createAddTabButton(writer), tabList);

    // Append tabList and tabContent in the correct order
    writer.append(tabList, tabHeader);
    writer.append(tabHeader, containerDiv);
    writer.append(tabContent, containerDiv);

    return containerDiv;
}

// Find all descendants that match a condition
export function findAllDescendants(node, predicate) {
    let results = [];
    if (!node || !node.getChildren) return results;

    const children = node.getChildren();
    for (const child of children) {
        if (predicate(child)) results.push(child);

        // Recursively find further, ensuring that 'findAllDescendants' is called correctly
        results = results.concat(findAllDescendants(child, predicate));
    }
    return results;
}

// Create tab element
export function createTabElement(writer, tabId) {
    return {
        tabListItem: createTabListItem(writer, tabId),
        tabNestedContent: createTabContent(writer, tabId),
    };
}

// Create tab list item
export function createTabListItem(writer, tabId) {
    const tabListItem = writer.createElement('tabListItem', { 'data-target': `#${tabId}` });
    const tabListItemLabel = writer.createElement('tabListItemLabelDiv');
    const tabListTable = writer.createElement('tabListTable');
    const tabListTable_thead = writer.createElement('tabListTable_thead');
    const tabListTable_tbody = writer.createElement('tabListTable_tbody');

    const tabListTable_thead_tr = writer.createElement('tabListTable_tr');
    const tabListTable_th_moveLeft = writer.createElement('tabListTable_th');
    const tabListTable_th_moveRight = writer.createElement('tabListTable_th');
    const tabListTable_th_delete = writer.createElement('tabListTable_th');

    appendControlElement(writer, tabListTable_th_moveLeft, 'moveLeftButton');
    appendControlElement(writer, tabListTable_th_moveRight, 'moveRightButton');

    // Create the delete tab button with the correct structure
    const deleteTabButton = writer.createElement('deleteTabButton');
    const deleteTabButtonParagraph = writer.createElement('deleteTabButtonParagraph');
    writer.append(deleteTabButtonParagraph, deleteTabButton);
    writer.append(deleteTabButton, tabListTable_th_delete);

    writer.append(tabListTable_th_moveLeft, tabListTable_thead_tr);
    writer.append(tabListTable_th_moveRight, tabListTable_thead_tr);
    writer.append(tabListTable_th_delete, tabListTable_thead_tr);
    writer.append(tabListTable_thead_tr, tabListTable_thead);

    const tabListTable_tbody_tr = writer.createElement('tabListTable_tr');
    const tabListTable_td = writer.createElement('tabListTable_td', { colspan: '5' });

    const tabTitle = writer.createElement('tabTitle', { bold: true });
    writer.insertText('Tab Name', tabTitle);

    writer.append(tabTitle, tabListTable_td);
    writer.append(tabListTable_td, tabListTable_tbody_tr);
    writer.append(tabListTable_tbody_tr, tabListTable_tbody);

    writer.append(tabListTable_thead, tabListTable);
    writer.append(tabListTable_tbody, tabListTable);
    writer.append(tabListTable, tabListItemLabel);
    writer.append(tabListItemLabel, tabListItem);

    return tabListItem;
}

// Create tab content
export function createTabContent(writer, tabId) {
    const tabContentElement = writer.createElement('tabNestedContent', { id: tabId });
    const paragraphElement = writer.createElement('paragraph');
    writer.insertText('Tab Content', paragraphElement);
    writer.append(paragraphElement, tabContentElement);
    return tabContentElement;
}

// Create 'Add Tab' button
export function createAddTabButton(writer) {
    const addTabListItem = writer.createElement('addTabListItem');
    const addTabButton = writer.createElement('addTabButton');
    const addTabIcon = writer.createElement('addTabIcon');
    writer.append(addTabIcon, addTabButton);
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Append control element
export function appendControlElement(writer, parent, type) {
    const element = writer.createElement(type, { class: type });
    writer.append(element, parent);
    return element;
}
