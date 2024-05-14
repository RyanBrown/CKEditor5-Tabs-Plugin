// Function to create a new tabs plugin element with an initial tab
export function createTabsPluginElement(writer) {
    // Create the main tabsPlugin container
    const tabsPlugin = writer.createElement('tabsPlugin');
    // Create the tabList container
    const tabList = writer.createElement('tabList', { class: 'tab-list' });
    // Create the tabContent container
    const tabContent = writer.createElement('tabContent', {
        class: 'tab-content',
    });

    // Generate a unique tabId for the initial tab
    const initialTabId = `tab_${Date.now()}`;

    // Add an initial tab
    const { tabListItem, tabNestedContent } = createTabElement(writer, initialTabId);
    writer.append(tabListItem, tabList);
    writer.append(tabNestedContent, tabContent);

    // Add the 'Add Tab' button to the tabList as the last item
    const addTabButton = createAddTabButton(writer, initialTabId);
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
    console.log(`utils.js - createTabListItem called for #${tabId}`);
    const tabListItem = writer.createElement('tabListItem', {
        'data-target': `#${tabId}`,
        class: 'tab-list-item',
    });
    const tabEditBar = createTabEditBar(writer, tabId);
    const tabTitleEditBar = writer.createElement('tabTitleEditBar', {
        class: 'title-edit-bar',
    });
    const tabTitle = writer.createElement('tabTitle', { class: 'tab-title' });
    // writer.insertText(`Tab Name ${Date.now()}`, tabTitle);
    // Insert placeholder text or actual data
    writer.insertText(`Editable ${tabId}`, tabTitle);

    const removeTabButton = writer.createElement('removeTabButton', {
        class: 'remove-tab-button',
        title: 'remove tab',
    });

    // Append tabTitle to tabListItem or its container
    writer.append(tabTitle, tabListItem);

    writer.append(tabTitle, tabTitleEditBar);
    writer.append(removeTabButton, tabTitleEditBar);
    writer.append(tabEditBar, tabListItem);
    writer.append(tabTitleEditBar, tabListItem);

    return tabListItem;
}

// Helper function to create a tab-list-item edit bar with move left/right controls
export function createTabEditBar(writer, tabId) {
    // console.log(`utils.js - createTabEditBar called for #${tabId}`);
    const tabEditBar = writer.createElement('tabEditBar', {
        class: 'tab-edit-bar',
    });
    appendControlElement(writer, tabEditBar, 'moveLeftButton', 'move tab-list-item left', tabId);
    appendControlElement(writer, tabEditBar, 'moveRightButton', 'move tab-list-item right', tabId);
    return tabEditBar;
}

// Function to create an 'Add Tab' button element
export function createAddTabButton(writer, tabId) {
    console.log('utils.js - createAddTabButton called');
    const addTabListItem = writer.createElement('addTabListItem', {
        class: 'add-tab-list-item',
    });
    const addTabButton = writer.createElement('addTabButton');
    writer.append(addTabButton, addTabListItem);
    return addTabListItem;
}

// Function to create a new tab content element
export function createTabContent(writer, tabId) {
    console.log(`utils.js - createTabContent called for #${tabId}`);
    const tabNestedContent = writer.createElement('tabNestedContent', {
        id: tabId,
        class: 'tab-nested-content',
    });
    const tabNestedContentTitle = writer.createElement('tabNestedContentTitle');
    writer.insertText(`Tab Content ${Date.now()}`, tabNestedContentTitle);
    writer.append(tabNestedContentTitle, tabNestedContent);
    return tabNestedContent;
}

// Utility function to append control elements like move left, move right, and remove
export function appendControlElement(writer, parent, type, title, tabId) {
    // console.log(`utils.js - appendControlElement called for #${tabId} - ${type}`);
    const element = writer.createElement(type, { class: type, title: title });
    writer.append(element, parent);
}