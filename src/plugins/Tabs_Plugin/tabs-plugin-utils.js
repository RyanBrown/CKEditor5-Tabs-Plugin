import { generateTabId } from './tabs-plugin-command';

// Function to create a new tabs plugin element with two initial tabs using centralized tabId
export function createTabsPluginElement(writer) {
    const tabsPlugin = writer.createElement('tabsPlugin');
    const tabList = writer.createElement('tabList', { class: 'tab-list' });
    const tabContent = writer.createElement('tabContent', { class: 'tab-content' });

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

    writer.append(tabList, tabsPlugin);
    writer.append(tabContent, tabsPlugin);

    return tabsPlugin;
}

// Helper function to recursively find all descendants that match a condition
export function findAllDescendants(node, predicate) {
    let results = [];
    if (!node || !node.getChildren) {
        // Return empty if node is undefined or cannot have children (e.g., it's a text node)
        return results;
    }

    const children = node.getChildren();
    for (const child of children) {
        if (predicate(child)) {
            results.push(child);
        }
        // Recursively find further, ensuring that 'findAllDescendants' is called correctly
        results = results.concat(findAllDescendants(child, predicate));
    }
    return results;
}

// Function to create a new tab element (tab list item and corresponding content)
export function createTabElement(writer, tabId) {
    const tabListItem = createTabListItem(writer, tabId);
    const tabNestedContent = createTabContent(writer, tabId);
    return { tabListItem, tabNestedContent };
}

// Function to create a new tab list item element
export function createTabListItem(writer, tabId) {
    const tabListItem = writer.createElement('tabListItem', {
        'data-target': `#${tabId}`,
        class: 'tab-list-item',
    });

    const tabEditBar = writer.createElement('tabEditBar', { class: 'tab-edit-bar' });
    const moveButtonsWrapper = writer.createElement('moveButtonsWrapper', { class: 'move-buttons-wrapper' });

    appendControlElement(writer, moveButtonsWrapper, 'moveLeftButton', 'Move Left', tabId);
    appendControlElement(writer, moveButtonsWrapper, 'moveRightButton', 'Move Right', tabId);

    writer.append(moveButtonsWrapper, tabEditBar);
    appendControlElement(writer, tabEditBar, 'deleteTabButton', 'Delete', tabId);

    const tabTitle = writer.createElement('tabTitle', { class: 'tab-title' });

    // Add placeholder text or actual data
    writer.insertText(`Tab Name`, tabTitle);

    writer.append(tabEditBar, tabListItem);
    writer.append(tabTitle, tabListItem);

    return tabListItem;
}

// Helper function to create a tab-list-item edit bar with move left/right controls
export function createTabContent(writer, tabId) {
    const tabNestedContent = writer.createElement('tabNestedContent', {
        id: tabId,
        class: 'tab-nested-content',
    });

    writer.setAttribute('placeholder', `Tab Content ${tabId}`, tabNestedContent);
    return tabNestedContent;
}

// Function to create an 'Add Tab' button element
export function createAddTabButton(writer) {
    const addTabListItem = writer.createElement('addTabListItem', { class: 'add-tab-list-item' });
    const addTabButton = writer.createElement('addTabButton');
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Utility function to append control elements like move left, move right, and delete
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title });
    writer.append(element, parent);
}
