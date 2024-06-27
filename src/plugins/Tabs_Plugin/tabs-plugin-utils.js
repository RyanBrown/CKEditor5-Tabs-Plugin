let counter = 0; // Initialize a counter for generating unique IDs

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

// Create tab element (both list item and nested content)
export function createTabElement(writer, pluginId, tabId) {
    const tabListItem = createTabListItem(writer, tabId, pluginId);
    const tabNestedContent = createTabNestedContent(writer, tabId, pluginId);
    return { tabListItem, tabNestedContent };
}

// Create tab list item
export function createTabListItem(writer, tabId, pluginId) {
    const tabListItem = writer.createElement('tabListItem', {
        'data-target': `#${tabId}`,
        'data-container-id': pluginId,
    });
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

// Create tab nested content
export function createTabNestedContent(writer, tabId, pluginId) {
    const tabNestedContent = writer.createElement('tabNestedContent', {
        id: tabId,
        'data-target': `#${tabId}`,
        'data-container-id': pluginId,
    });
    const paragraph = writer.createElement('paragraph');
    writer.insertText('Tab Content', paragraph);
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
                if (!containerDiv) continue;

                const tabHeader = containerDiv.getChild(0);
                if (!tabHeader) continue;

                const tabList = tabHeader.getChild(0);
                if (!tabList) continue;

                const tabContent = containerDiv.getChild(1);
                if (!tabContent) continue;

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

// Ensures that any newly added tabs can be clicked and will set the `tabListItem` and `tabNestedContent`
export function setupTabClickHandlers(editor) {
    const viewDocument = editor.editing.view.document;

    // Helper function to activate the tab
    function activateTab(tabListItem, tabContainerId) {
        const tabId = tabListItem.getAttribute('data-target').slice(1); // Remove the '#' from the start
        const viewRoot = editor.editing.view.document.getRoot();

        const tabsPlugin = Array.from(viewRoot.getChildren()).find(
            (child) =>
                child.is('element', 'div') &&
                child.hasClass('tabcontainer') &&
                child.getAttribute('id') === tabContainerId
        );

        if (!tabsPlugin) {
            console.error('Tabs plugin element not found');
            return;
        }

        const containerDiv = tabsPlugin.getChild(0);
        const tabHeader = containerDiv.getChild(0);
        const tabList = tabHeader.getChild(0);
        const tabContent = containerDiv.getChild(1);

        if (!tabList || !tabContent) {
            console.error('Tab list or content element not found');
            return;
        }

        editor.editing.view.change((writer) => {
            // Remove 'active' class from all tab list items and tab content elements within this tabs instance
            for (const item of tabList.getChildren()) {
                writer.setAttribute('class', (item.getAttribute('class') || '').replace(' active', ''), item);
            }
            for (const content of tabContent.getChildren()) {
                writer.setAttribute('class', (content.getAttribute('class') || '').replace(' active', ''), content);
            }

            writer.setAttribute('class', (tabListItem.getAttribute('class') || '') + ' active', tabListItem);

            const selectedTabContent = Array.from(tabContent.getChildren()).find(
                (child) => child.getAttribute('id') === tabId
            );
            if (selectedTabContent) {
                writer.setAttribute(
                    'class',
                    (selectedTabContent.getAttribute('class') || '') + ' active',
                    selectedTabContent
                );
            } else {
                console.error('Selected tab content not found', tabId);
            }
        });
    }

    // Attach event listener to the document for handling clicks on tab links
    viewDocument.on(
        'click',
        (evt, data) => {
            const target = data.target;
            let tabListItem = target.findAncestor('li');

            if (tabListItem && tabListItem.hasClass('tablinks')) {
                // Check if the click target is not a move or delete button
                if (!target.hasClass('left-arrow') && !target.hasClass('right-arrow') && !target.hasClass('dropicon')) {
                    const tabsPlugin = tabListItem.findAncestor(
                        (element) => element.name === 'div' && element.hasClass('tabcontainer')
                    );
                    if (tabsPlugin) {
                        const tabContainerId = tabsPlugin.getAttribute('id');
                        activateTab(tabListItem, tabContainerId);
                    } else {
                        console.error('TabsPlugin container not found');
                    }
                    evt.stop();
                }
            }
        },
        { priority: 'high' }
    );
}

// Initializes tabs to ensure they are set up correctly when the editor is loaded
export function initializeTabsOnLoad(editor) {
    const viewRoot = editor.editing.view.document.getRoot();

    // Ensure active tab is set for all existing tabs on load
    editor.model.change((writer) => {
        for (const element of viewRoot.getChildren()) {
            if (element.is('element', 'tabsPlugin')) {
                const containerDiv = element.getChild(0);
                if (!containerDiv) continue;

                const tabHeader = containerDiv.getChild(0);
                if (!tabHeader) continue;

                const tabList = tabHeader.getChild(0);
                const tabContent = containerDiv.getChild(1);

                if (!tabList || !tabContent) continue;

                for (const tabListItem of tabList.getChildren()) {
                    if (tabListItem.hasClass('active')) {
                        const tabId = tabListItem.getAttribute('data-target').slice(1);
                        const tabNestedContent = Array.from(tabContent.getChildren()).find(
                            (child) => child.getAttribute('id') === tabId
                        );
                        if (tabNestedContent) {
                            writer.setAttribute(
                                'class',
                                (tabNestedContent.getAttribute('class') || '') + ' active',
                                tabNestedContent
                            );
                        }
                    }
                }
            }
        }
    });
}
