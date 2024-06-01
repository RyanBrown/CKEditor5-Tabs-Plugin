import { generateTabId } from './tabs-plugin-command';

// Create tabs plugin element with two initial tabs
export function createTabsPluginElement(writer) {
    const tabsPlugin = writer.createElement('tabsPlugin');
    const containerDiv = writer.createElement('containerDiv');
    const tabHeader = writer.createElement('tabHeader');
    const tabList = writer.createElement('tabList');
    const tabContent = writer.createElement('tabContent');

    // Create the first tab using centralized tabId generation
    const firstTabId = generateTabId();
    const { tabListItem: firstTabListItem, tabNestedContent: firstTabNestedContent } = createTabElement(
        writer,
        firstTabId
    );
    // Add active class to the first tab and content
    writer.setAttribute('class', `${firstTabListItem.getAttribute('class')} yui3-tab-selected`, firstTabListItem);
    writer.setAttribute(
        'class',
        `${firstTabNestedContent.getAttribute('class')} yui3-tab-panel-selected`,
        firstTabNestedContent
    );
    writer.append(firstTabListItem, tabList);
    writer.append(firstTabNestedContent, tabContent);

    // Create the second tab using centralized tabId generation
    const secondTabId = generateTabId();
    const { tabListItem: secondTabListItem, tabNestedContent: secondTabNestedContent } = createTabElement(
        writer,
        secondTabId
    );
    writer.append(secondTabListItem, tabList);
    writer.append(secondTabNestedContent, tabContent);

    // Add the 'Add Tab' button to the tabList as the last item
    const addTabButton = createAddTabButton(writer);
    writer.append(addTabButton, tabList);

    // Append tabList to the tabHeader
    writer.append(tabList, tabHeader);
    // Append tabHeader to the containerDiv
    writer.append(tabHeader, containerDiv);
    // Append tabContent to the containerDiv
    writer.append(tabContent, containerDiv);
    // Append the containerDiv to tabsPlugin
    writer.append(containerDiv, tabsPlugin);

    return tabsPlugin;
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
    const tabListItem = createTabListItem(writer, tabId);
    const tabNestedContent = createTabContent(writer, tabId);
    return { tabListItem, tabNestedContent };
}

// Create tab list item
export function createTabListItem(writer, tabId) {
    const tabListItem = writer.createElement('tabListItem', { 'data-target': `#${tabId}` });
    const tabEditBar = writer.createElement('tabEditBar');

    // Create the table structure inside the tabEditBar
    const table = writer.createElement('table');

    // Create thead and append it to the table
    const thead = writer.createElement('thead');
    writer.append(thead, table);

    const trHead = writer.createElement('tr');
    writer.append(trHead, thead);

    const th1 = writer.createElement('th');
    const moveLeftButton = writer.createElement('moveLeftButton');
    writer.insertText('\u00A0', moveLeftButton); // Insert a non-breaking space
    writer.append(moveLeftButton, th1);
    writer.append(th1, trHead);

    const th2 = writer.createElement('th');
    const moveRightButton = writer.createElement('moveRightButton');
    writer.insertText('\u00A0', moveRightButton); // Insert a non-breaking space
    writer.append(moveRightButton, th2);
    writer.append(th2, trHead);

    // Add empty <th> elements for spacing
    const th3 = writer.createElement('th');
    writer.insertText('\u00A0', th3); // Insert a non-breaking space
    writer.append(th3, trHead);

    const th4 = writer.createElement('th');
    writer.insertText('\u00A0', th4); // Insert a non-breaking space
    writer.append(th4, trHead);

    const th5 = writer.createElement('th');
    const deleteTabButton = createDeleteTabButton(writer);
    writer.append(deleteTabButton, th5);
    writer.append(th5, trHead);

    // Create tbody and append it to the table
    const tbody = writer.createElement('tbody');
    writer.append(tbody, table);

    const trBody = writer.createElement('tr');
    writer.append(trBody, tbody);

    const td = writer.createElement('td', { colspan: '5' });
    writer.append(td, trBody);

    const tabTitle = writer.createElement('tabTitle', { class: 'tabTitle' });
    writer.insertText('Tab Name', tabTitle);
    writer.append(tabTitle, td);

    writer.append(table, tabEditBar);
    writer.append(tabEditBar, tabListItem);

    return tabListItem;
}

function createDeleteTabButton(writer) {
    const deleteTabButton = writer.createElement('deleteTabButton');
    const dropParagraph = writer.createElement('dropParagraph');
    writer.insertText('\u00A0', dropParagraph);
    writer.append(dropParagraph, deleteTabButton);
    return deleteTabButton;
}

// Create tab content
export function createTabContent(writer, tabId) {
    const tabContent = writer.createElement('tabNestedContent', {
        id: tabId,
        class: 'yui3-tab-panel tabcontent',
    });
    if (!tabContent) {
        console.error('Failed to create tab content');
    }
    return tabContent;
}

// Create 'Add Tab' button
export function createAddTabButton(writer) {
    const addTabListItem = writer.createElement('addTabListItem');
    const addTabButton = writer.createElement('addTabButton');
    const addTabIcon = writer.createElement('addTabIcon');
    writer.insertText('\u00A0', addTabIcon);
    writer.append(addTabIcon, addTabButton);
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Append control element
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title });
    writer.append(element, parent);
}
