import { generateTabId } from './tabs-plugin-command';

// Create tabs plugin element with two initial tabs
export function createTabsPluginElement(writer) {
    const tabsPlugin = writer.createElement('tabsPlugin');
    const containerDiv = writer.createElement('containerDiv', { class: 'container' });
    const tabHeader = writer.createElement('tabHeader', { class: 'tabheader' });

    const tabList = writer.createElement('tabList', { class: 'tabList' });
    const tabContent = writer.createElement('tabContent', { class: 'tabContent' });

    // Create the first tab using centralized tabId generation
    const firstTabId = generateTabId();
    const { tabListItem: firstTabListItem, tabNestedContent: firstTabNestedContent } = createTabElement(
        writer,
        firstTabId
    );
    // Add active class to the first tab and content
    writer.setAttribute('class', `${firstTabListItem.getAttribute('class')} active`, firstTabListItem);
    writer.setAttribute('class', `${firstTabNestedContent.getAttribute('class')} active`, firstTabNestedContent);
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
        class: 'yui3-tab yui3-tab-selected tablinks',
    });
    const tabEditBar = writer.createElement('tabEditBar', { class: 'yui3-tab-label' });
    const moveButtonsWrapper = writer.createElement('moveButtonsWrapper', { class: 'move-buttons-wrapper' });

    appendControlElement(writer, moveButtonsWrapper, 'moveLeftButton', 'Move Tab Left');
    appendControlElement(writer, moveButtonsWrapper, 'moveRightButton', 'Move Tab Right');
    writer.append(moveButtonsWrapper, tabEditBar);
    appendControlElement(writer, tabEditBar, 'deleteTabButton', 'Delete Tab');

    const tabTitle = writer.createElement('tabTitle', { class: 'tabTitle' });
    writer.insertText(`Tab Name`, tabTitle);

    writer.append(tabEditBar, tabListItem);
    writer.append(tabTitle, tabListItem);

    return tabListItem;
}

// Create tab content
export function createTabContent(writer, tabId) {
    return writer.createElement('tabNestedContent', {
        id: tabId,
        class: 'yui3-tab-panel-selected tabcontent',
    });
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
