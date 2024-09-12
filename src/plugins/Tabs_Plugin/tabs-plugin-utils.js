let counter = 0; // Initialize a counter for generating unique IDs

// Generate a unique ID with a given prefix
export function generateId(prefix) {
    // Use the current timestamp and an incremented counter to ensure uniqueness
    return `${prefix}_${Date.now()}_${counter++}`;
}

// Create tabs plugin element with two initial tabs
export function createTabsPlugin(writer, pluginId) {
    // console.log(`createTabsPlugin: Creating tabs plugin with ID: ${pluginId}`);
    // Create the main tabs plugin element
    const tabsPlugin = writer.createElement('tabsPlugin', { id: pluginId });
    // Create the container and structure for tabs
    const containerDiv = writer.createElement('containerDiv');
    const tabHeader = writer.createElement('tabHeader'); // Header containing the tab list
    const tabList = writer.createElement('tabList'); // List containing the tabs (tab links)
    const tabContent = writer.createElement('tabContent'); // Container for tab content (associated with each tab)

    // Create two initial tabs
    for (let i = 0; i < 2; i++) {
        const tabId = generateId('tab-id');
        // console.log(`createTabsPlugin: Creating tab with ID: ${tabId}`);
        // Create a tab list item and the corresponding content for the tab
        const { tabListItem, tabNestedContent } = createTabElement(writer, pluginId, tabId);

        // Append the tab list item to the tab list and the content to the tab content container
        writer.append(tabListItem, tabList);
        writer.append(tabNestedContent, tabContent);
        console.log(`createTabsPlugin: Appended tabListItem and tabNestedContent for tab ID: ${tabId}`);
    }

    // Add the 'Add Tab' button to the tabList as the last item
    writer.append(createAddTabButton(writer), tabList);

    // Append the tab list and tab content in the correct order
    writer.append(tabList, tabHeader);
    writer.append(tabHeader, containerDiv);
    writer.append(tabContent, containerDiv);
    writer.append(containerDiv, tabsPlugin);

    return tabsPlugin;
}

// Recursively find all descendants that match a given condition (predicate)
export function findAllDescendants(node, predicate) {
    let results = [];
    if (!node || !node.getChildren) return results; // Return an empty array if the node or children don't exist

    const children = node.getChildren(); // Get all children of the current node
    for (const child of children) {
        if (predicate(child)) results.push(child); // Add to results if the child matches the condition

        // Recursively search through the child nodes
        results = results.concat(findAllDescendants(child, predicate));
    }
    return results;
}

// Create a tab element (both list item and nested content) with unique IDs
export function createTabElement(writer, pluginId, tabId) {
    const tabListItem = createTabListItem(writer, tabId, pluginId); // Create the tab list item
    const tabNestedContent = createTabNestedContent(writer, tabId, pluginId); // Create the corresponding tab content

    // Return both the tab list item and its associated content
    return { tabListItem, tabNestedContent };
}

// Create a single tab list item element for the tab with controls like move left, right, and delete
export function createTabListItem(writer, tabId, pluginId) {
    // console.log(`Creating tabListItem for tabId: ${tabId} and pluginId: ${pluginId}`);

    // Create the main tab list item
    const tabListItem = writer.createElement('tabListItem', {
        'data-target': `#${tabId}`, // Associate the list item with the corresponding tab content using its ID
        'data-plugin-id': pluginId, // Set the plugin ID for reference
    });

    // Create the container structure for tab controls (move left, move right, delete) and tab title
    const tabListItemLabel = writer.createElement('tabListItemLabelDiv');
    const tabListTable = writer.createElement('tabListTable');
    const tabListTable_thead = writer.createElement('tabListTable_thead');
    const tabListTable_tbody = writer.createElement('tabListTable_tbody');

    // Create the table row and controls for the tab (move left, move right, delete)
    const tabListTable_thead_tr = writer.createElement('tabListTable_tr');
    const tabListTable_th_moveLeft = writer.createElement('tabListTable_th');
    const tabListTable_th_moveRight = writer.createElement('tabListTable_th');
    const tabListTable_th_delete = writer.createElement('tabListTable_th');

    // Add move left and move right buttons
    appendControlElement(writer, tabListTable_th_moveLeft, 'moveLeftButton');
    appendControlElement(writer, tabListTable_th_moveRight, 'moveRightButton');

    // Create the delete tab button
    const deleteTabButton = writer.createElement('deleteTabButton');
    const deleteTabButtonParagraph = writer.createElement('deleteTabButtonParagraph');
    writer.append(deleteTabButtonParagraph, deleteTabButton);
    writer.append(deleteTabButton, tabListTable_th_delete);

    // Append control elements to the table row
    writer.append(tabListTable_th_moveLeft, tabListTable_thead_tr);
    writer.append(tabListTable_th_moveRight, tabListTable_thead_tr);
    writer.append(tabListTable_th_delete, tabListTable_thead_tr);
    writer.append(tabListTable_thead_tr, tabListTable_thead);

    // Create the table row for the tab title
    const tabListTable_tbody_tr = writer.createElement('tabListTable_tr');
    const tabListTable_td = writer.createElement('tabListTable_td', { colspan: '5' });

    // Create the title element for the tab
    const tabTitle = writer.createElement('tabTitle');
    // Split the tabId string by '_' and take the last part after the final '_'
    const tabIdSuffix = tabId.split('_').pop();
    writer.insertText(`Tab Name ${tabIdSuffix}`, tabTitle);
    // writer.insertText('Tab Name', tabTitle); // Insert tab name with its ID

    // Append title to the table and the overall tab structure
    writer.append(tabTitle, tabListTable_td);
    writer.append(tabListTable_td, tabListTable_tbody_tr);
    writer.append(tabListTable_tbody_tr, tabListTable_tbody);

    // Append the header and body of the table
    writer.append(tabListTable_thead, tabListTable);
    writer.append(tabListTable_tbody, tabListTable);
    writer.append(tabListTable, tabListItemLabel);
    writer.append(tabListItemLabel, tabListItem);

    return tabListItem;
}

// Create the content associated with the tab (nested content)
export function createTabNestedContent(writer, tabId, pluginId) {
    // Create the tab content with its unique ID and corresponding plugin ID
    const tabNestedContent = writer.createElement('tabNestedContent', {
        id: tabId,
        'data-target': `#${tabId}`, // Ensure the content is associated with the correct tab
        'data-plugin-id': pluginId, // Set the plugin ID
    });

    // Create a paragraph for the tab content
    const paragraph = writer.createElement('paragraph');
    // Split the tabId string by '_' and take the last part after the final '_'
    const tabIdSuffix = tabId.split('_').pop();
    writer.insertText(`Tab Content ${tabIdSuffix}`, paragraph);
    // writer.insertText('Tab Content', paragraph); // Insert text for the content

    // Append the paragraph to the tab content element
    writer.append(paragraph, tabNestedContent);

    return tabNestedContent;
}

// Create the 'Add Tab' button element
export function createAddTabButton(writer) {
    const addTabListItem = writer.createElement('addTabListItem'); // Create a list item for the button
    const addTabButton = writer.createElement('addTabButton'); // Create the button itself
    const addTabIcon = writer.createElement('addTabIcon'); // Create an icon for the button

    // Append the icon and button to the list item
    writer.append(addTabIcon, addTabButton);
    writer.append(addTabButton, addTabListItem);

    return addTabListItem;
}

// Append control element (e.g., buttons) for left/right movement
export function appendControlElement(writer, parent, type, title) {
    const element = writer.createElement(type, { class: type, title }); // Create the control element
    writer.append(element, parent); // Append it to the parent element
    return element;
}

// Set the 'active' class for a tab list item or content (to mark it as active)
export function setActiveClass(writer, element) {
    const classList = element.getAttribute('class') || ''; // Get the existing class list
    if (!classList.includes('active')) {
        // Add the 'active' class if it is not already present
        writer.setAttribute('class', `${classList} active`, element); // ACTIVE_CLASS_ADDED: Applying 'active' class
    }
}

// Remove the 'active' class from a tab list item or content
export function removeActiveClass(writer, element) {
    const classList = element.getAttribute('class') || ''; // Get the existing class list
    if (classList.includes('active')) {
        // Remove the 'active' class if it is present
        writer.setAttribute('class', classList.replace(' active', ''), element); // ACTIVE_CLASS_REMOVED: Removing 'active' class
    }
}

// Ensure the first tab is active by default
export function ensureActiveTab(writer, model) {
    if (!model?.document) return; // Exit if the model or document is not available

    const root = model.document.getRoot(); // Get the root of the document

    // Change the model to set the active tab
    model.change(() => {
        for (const tabsPlugin of root.getChildren()) {
            if (!tabsPlugin.is('element', 'tabsPlugin')) continue; // Skip if it's not a tabsPlugin element

            const containerDiv = tabsPlugin.getChild(0);
            const tabHeader = containerDiv?.getChild(0);
            const tabList = tabHeader?.getChild(0);
            const tabContent = containerDiv?.getChild(1);

            if (tabList && tabContent) {
                const firstTabListItem = tabList.getChild(0); // Get the first tab list item
                const firstTabNestedContent = tabContent.getChild(0); // Get the corresponding content

                // Set the 'active' class for the first tab and its content
                const itemsToActivate = [firstTabListItem, firstTabNestedContent];
                // Loop through the array to set the 'active' class for both the tab and its content
                for (const item of itemsToActivate) {
                    setActiveClass(writer, item); // ACTIVE_CLASS_ADDED: Applying 'active' class to the first tab and its content
                }
            }
        }
    });
}

// Ensure active tab is set for all existing tabs on load
export function initializeTabsOnLoad(editor) {
    const viewRoot = editor.editing.view.document.getRoot(); // Get the view root of the editor

    // Ensure active tab is set for all existing tabs on load
    editor.model.change((writer) => {
        for (const element of viewRoot.getChildren()) {
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

                if (!tabList || !tabContent) continue;

                // Ensure that active content corresponds to active tab list items
                for (const tabListItem of tabList.getChildren()) {
                    if (tabListItem.hasClass('active')) {
                        const tabId = tabListItem.getAttribute('data-target').slice(1);
                        const tabNestedContent = Array.from(tabContent.getChildren()).find(
                            (child) => child.getAttribute('id') === tabId
                        );
                        if (tabNestedContent) {
                            setActiveClass(writer, tabNestedContent); // ACTIVE_CLASS_ADDED: Applying 'active' class to matching content
                        }
                    }
                }
            }
        }
    });
}

// Ensure that any newly added tabs can be clicked and will set the `tabListItem` and `tabNestedContent`
export function setupTabClickHandlers(editor) {
    const viewDocument = editor.editing.view.document; // Get the document view

    // Helper function to activate the tab when clicked
    function activateTab(tabListItem, tabPluginId) {
        const tabId = tabListItem.getAttribute('data-target').slice(1); // Get the tab ID (without '#')
        const viewRoot = editor.editing.view.document.getRoot(); // Get the view root

        // Find the corresponding tabs plugin element
        const tabsPlugin = Array.from(viewRoot.getChildren()).find(
            (child) =>
                child.is('element', 'div') && child.hasClass('tabcontainer') && child.getAttribute('id') === tabPluginId
        );

        if (!tabsPlugin) {
            console.error(`activateTab: Tabs plugin element not found for ID: ${tabPluginId}`);
            return;
        }

        const containerDiv = tabsPlugin.getChild(0);
        const tabList = containerDiv?.getChild(0)?.getChild(0);
        const tabContent = containerDiv?.getChild(1);

        if (!tabList || !tabContent) {
            console.error('activateTab: Tab list or content element not found');
            return;
        }

        editor.editing.view.change((writer) => {
            // Remove the 'active' class from all tab list items and tab content elements
            const itemsToDeactivate = [...tabList.getChildren(), ...tabContent.getChildren()];
            // Loop through the combined array to remove the 'active' class from all tabs and content
            for (const item of itemsToDeactivate) {
                removeActiveClass(writer, item); // ACTIVE_CLASS_REMOVED: Removing 'active' class from all tabs and content
            }

            // Activate the clicked tab and its corresponding content
            setActiveClass(writer, tabListItem); // Set the 'active' class for the tab

            // Find the corresponding tab content based on the tab ID
            const selectedTabContent = Array.from(tabContent.getChildren()).find(
                (child) => child.getAttribute('id') === tabId
            );
            if (selectedTabContent) {
                setActiveClass(writer, selectedTabContent); // Set the 'active' class for the content
            } else {
                // If the tab content is missing, create a new content element
                const newTabContent = writer.createElement('tabNestedContent', {
                    id: tabId,
                    class: 'yui3-tab-panel tabcontent', // Initial class for the new content
                });
                // Use setActiveClass function to set the 'active' class
                setActiveClass(writer, newTabContent); // ACTIVE_CLASS_ADDED: Applying 'active' class to the newly created content
                writer.append(newTabContent, tabContent);
            }
        });
    }

    // Attach event listener to handle clicks on tab links
    viewDocument.on(
        'click',
        (evt, data) => {
            const target = data.target;
            const tabListItem = target.findAncestor('li'); // Get the clicked tab's list item

            if (tabListItem?.hasClass('tablinks')) {
                // Avoid activating the tab if clicked on move or delete buttons
                if (!['left-arrow', 'right-arrow', 'dropicon'].some((cls) => target.hasClass(cls))) {
                    const tabsPlugin = tabListItem.findAncestor(
                        (el) => el.is('element', 'div') && el.hasClass('tabcontainer')
                    );
                    const tabPluginId = tabsPlugin?.getAttribute('id');

                    if (tabsPlugin) {
                        activateTab(tabListItem, tabPluginId); // Activate the clicked tab
                    } else {
                        console.error('TabsPlugin container not found');
                    }
                }
            }
        },
        { priority: 'high' } // Ensure the event handler has high priority
    );
}
