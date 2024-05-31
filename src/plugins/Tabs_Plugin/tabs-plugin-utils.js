import { generateTabId } from './tabs-plugin-command';

// Create tabs plugin element with two initial tabs
export function createTabsPluginElement(writer) {
    const tabsPlugin = writer.createElement('tabsPlugin');
    const containerDiv = writer.createElement('containerDiv', {
        class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
    });
    const tabHeader = writer.createElement('tabHeader', { class: 'tabheader ah-tabs-horizontal' });

    const tabList = writer.createElement('tabList', { class: 'tab yui3-tabview-list' });
    const tabContent = writer.createElement('tabContent', { class: 'yui3-tabview-panel' });

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
    const tabListItem = writer.createElement('tabListItem', {
        'data-target': `#${tabId}`,
        class: 'yui3-tab tablinks',
    });
    const tabEditBar = writer.createElement('tabEditBar', { class: 'yui3-tab-label' });

    // Create the table structure inside the tabEditBar
    const table = writer.createElement('table');

    // Create thead and append it to the table
    const thead = writer.createElement('thead');
    writer.append(thead, table);

    const trHead = writer.createElement('tr');
    writer.append(trHead, thead);

    const th1 = writer.createElement('th');
    const moveLeftButton = writer.createElement('moveLeftButton', {
        class: 'left-arrow arrowtabicon',
        title: 'Move Tab Left',
    });
    writer.insertText('\u00A0', moveLeftButton); // Insert a non-breaking space
    writer.append(moveLeftButton, th1);
    writer.append(th1, trHead);

    const th2 = writer.createElement('th');
    const moveRightButton = writer.createElement('moveRightButton', {
        class: 'right-arrow arrowtabicon',
        title: 'Move Tab Right',
    });
    writer.insertText('\u00A0', moveRightButton); // Insert a non-breaking space
    writer.append(moveRightButton, th2);
    writer.append(th2, trHead);

    const th3 = writer.createElement('th');
    writer.insertText('\u00A0', th3); // Insert a non-breaking space
    const th4 = writer.createElement('th'); // extra bloat to match UCE
    writer.insertText('\u00A0', th4); // Insert a non-breaking space
    const th5 = writer.createElement('th'); // extra bloat to match UCE

    const deleteTabButton = writer.createElement('deleteTabButton', {
        class: 'dropicon',
        title: 'Delete Tab',
        contenteditable: 'false',
    });
    const droptab = writer.createElement('paragraph', {
        class: 'droptab',
        // class: 'droptab droptabicon',
        contenteditable: 'true',
        // onclick: 'parent.dropActiveTab(event);',
    });
    writer.insertText('\u00A0', droptab); // Insert a non-breaking space
    writer.append(droptab, deleteTabButton);
    writer.append(deleteTabButton, th5);
    writer.append(th3, trHead);
    writer.append(th4, trHead);
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
    const addTabListItem = writer.createElement('addTabListItem', { class: 'yui3-tab addtab' });
    const addTabButton = writer.createElement('addTabButton');
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Append control element
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title });
    writer.append(element, parent);
}
