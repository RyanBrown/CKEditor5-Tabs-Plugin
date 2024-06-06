import { generateTabId } from './tabs-plugin-command';

// Create tabs plugin element with two initial tabs
export function createTabsPluginElement(writer) {
    const tabsPlugin = writer.createElement('tabsPlugin');
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
        `${firstTabNestedContent.getAttribute('class')} yui3-tab-selected`,
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

    // Append tabList and tabContent in the correct order
    writer.append(tabList, tabsPlugin);
    writer.append(tabContent, tabsPlugin);

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
    const moveButtonsWrapper = writer.createElement('moveButtonsWrapper');

    appendControlElement(writer, moveButtonsWrapper, 'moveLeftButton', 'Move Tab Left');
    appendControlElement(writer, moveButtonsWrapper, 'moveRightButton', 'Move Tab Right');
    writer.append(moveButtonsWrapper, tabEditBar);
    appendControlElement(writer, tabEditBar, 'deleteTabButton', 'Delete Tab');

    const tabTitle = writer.createElement('tabTitle');
    writer.insertText(`Tab Name ${tabId}`, tabTitle);

    writer.append(tabEditBar, tabListItem);
    writer.append(tabTitle, tabListItem);

    return tabListItem;
}

// Create tab content
export function createTabContent(writer, tabId) {
    return writer.createElement('tabNestedContent', { id: tabId });
}

// Create 'Add Tab' button
export function createAddTabButton(writer) {
    const addTabListItem = writer.createElement('addTabListItem');
    const addTabButton = writer.createElement('addTabButton', { title: 'Add Tab' });
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Append control element
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title });
    writer.append(element, parent);
}
