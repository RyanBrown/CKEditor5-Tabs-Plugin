let counter = 0;

// Generate a unique ID with a given prefix
export function generateId(prefix) {
    return `${prefix}_${Date.now()}_${counter++}`;
}

// Create tabs plugin element with two initial tabs
export function createTabsPlugin(writer, pluginId) {
    const tabsPlugin = writer.createElement('tabsPlugin', { id: pluginId });
    const containerDiv = writer.createElement('containerDiv');
    const tabHeader = writer.createElement('tabHeader');
    const tabList = writer.createElement('tabList');
    const tabContent = writer.createElement('tabContent');

    // Create two initial tabs
    for (let i = 0; i < 2; i++) {
        const tabId = generateId('tab-id');
        const { tabListItem, tabNestedContent } = createTabElement(writer, pluginId, tabId);
        // Set the first tab as active by default
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
    writer.append(containerDiv, tabsPlugin);

    return tabsPlugin;
}

// Create tab element (both list item and nested content)
export function createTabElement(writer, pluginId, tabId) {
    const tabListItem = createTabListItem(writer, tabId);
    const tabNestedContent = createTabNestedContent(writer, pluginId, tabId);
    return { tabListItem, tabNestedContent };
}

// Create tab list item
export function createTabListItem(writer, tabId) {
    const tabListItem = writer.createElement('tabListItem', { 'data-target': `#${tabId}` });
    writer.setAttribute('id', tabId, tabListItem);

    const tabListItemLabel = writer.createElement('tabListItemLabelDiv');
    const tabListTable = writer.createElement('tabListTable');
    const tabListTable_thead = writer.createElement('tabListTable_thead');
    const tabListTable_tbody = writer.createElement('tabListTable_tbody');

    const tabListTable_thead_tr = writer.createElement('tabListTable_tr');
    const tabListTable_th_moveLeft = writer.createElement('tabListTable_th');
    const tabListTable_th_moveRight = writer.createElement('tabListTable_th');
    const tabListTable_th_delete = writer.createElement('tabListTable_th');

    appendControlElement(writer, tabListTable_th_moveLeft, 'moveLeftButton', 'Move Left');
    appendControlElement(writer, tabListTable_th_moveRight, 'moveRightButton', 'Move Right');

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

    // Log the position of the tab list item in the list
    const tabList = tabListItem.parent;
    if (tabList) {
        const position = Array.from(tabList.getChildren()).indexOf(tabListItem);
        console.log(`Tab list item position: ${position}`);
    }

    return tabListItem;
}

// Create tab nested content
export function createTabNestedContent(writer, tabContainerId, tabId, isActive = false) {
    const tabNestedContent = writer.createElement('tabNestedContent');
    writer.setAttribute('id', tabId, tabNestedContent);
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
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title });
    writer.append(element, parent);
    return element;
}

// Ensure the first tab is active by default
export function ensureActiveTab(writer, model) {
    if (!model || !model.document) {
        console.error('Model or model document is not defined');
        return;
    }

    const root = model.document.getRoot();

    model.change(() => {
        for (const element of root.getChildren()) {
            if (element.is('element', 'tabsPlugin')) {
                const containerDiv = element.getChild(0);
                const tabHeader = containerDiv.getChild(0);
                const tabList = tabHeader.getChild(0);
                const tabContent = containerDiv.getChild(1);

                const firstTabListItem = tabList.getChild(0);
                const firstTabNestedContent = tabContent.getChild(0);

                if (firstTabListItem && !(firstTabListItem.getAttribute('class') || '').includes('active')) {
                    writer.setAttribute(
                        'class',
                        (firstTabListItem.getAttribute('class') || '') + ' active',
                        firstTabListItem
                    );
                }

                if (firstTabNestedContent && !(firstTabNestedContent.getAttribute('class') || '').includes('active')) {
                    writer.setAttribute(
                        'class',
                        (firstTabNestedContent.getAttribute('class') || '') + ' active',
                        firstTabNestedContent
                    );
                }
            }
        }
    });
}
