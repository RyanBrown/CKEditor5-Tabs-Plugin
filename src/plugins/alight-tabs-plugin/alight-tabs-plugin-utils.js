// src/plugins/alight-tabs-plugin/alight-tabs-plugin-utils.js
// Map to store instances of the alightTabsPlugin associated with a unique pluginId.
export const tabsPluginMap = new Map();

let counter = 0;

// Generates a unique plugin ID.
export function generatePluginId() {
  return `plugin-${Date.now()}-${counter++}`;
}

// Creates a tab element consisting of a tabListItem and its corresponding tabNestedContent.
export function createTabElement(writer, dataIndex, pluginId) {
  const tabName = `Tab Name`;
  // const tabName = `Tab Name ${dataIndex + 1}`;
  const tabListItem = createTabListItem(writer, tabName, dataIndex, pluginId);
  // const tabNestedContent = createTabNestedContent(writer, `Content for ${tabName}`, dataIndex);
  const tabNestedContent = createTabNestedContent(writer, `Tab Content`, dataIndex);

  // Set 'isActive' attribute to true to mark the new tab as active.
  writer.setAttribute('isActive', true, tabListItem);
  writer.setAttribute('isActive', true, tabNestedContent);

  return { tabListItem, tabNestedContent };
}

// Creates a tabListItem element which represents a single tab.
export function createTabListItem(writer, tabName, dataIndex, pluginId) {
  const tabListItem = writer.createElement('tabListItem', { 'data-index': dataIndex, 'data-plugin-id': pluginId });

  const tabListItemLabelDiv = writer.createElement('tabListItemLabelDiv');
  const tabListTable = writer.createElement('tabListTable');
  const tabListTable_thead = writer.createElement('tabListTable_thead');
  const tabListTable_tbody = writer.createElement('tabListTable_tbody');

  const tabListTable_thead_tr = writer.createElement('tabListTable_tr');
  const tabListTable_th_moveLeft = writer.createElement('tabListTable_th');
  const tabListTable_th_moveRight = writer.createElement('tabListTable_th');
  const tabListTable_th_delete = writer.createElement('tabListTable_th');

  // Create buttons for moving and deleting the tab.
  const moveLeftButton = createMoveLeftButton(writer, dataIndex, pluginId);
  const moveRightButton = createMoveRightButton(writer, dataIndex, pluginId);
  const deleteTabButton = createDeleteTabButton(writer, dataIndex, pluginId);
  const deleteTabButtonParagraph = writer.createElement('deleteTabButtonParagraph');

  const tabListTable_tbody_tr = writer.createElement('tabListTable_tr');
  const tabListTable_td = writer.createElement('tabListTable_td', { colspan: '5' });

  const tabTitle = writer.createElement('tabTitle');
  writer.insertText(tabName, tabTitle);

  // Construct the table layout for the tab header.
  writer.append(moveLeftButton, tabListTable_th_moveLeft);
  writer.append(moveRightButton, tabListTable_th_moveRight);
  writer.append(deleteTabButtonParagraph, deleteTabButton);
  writer.append(deleteTabButton, tabListTable_th_delete);

  writer.append(tabListTable_th_moveLeft, tabListTable_thead_tr);
  writer.append(tabListTable_th_moveRight, tabListTable_thead_tr);
  writer.append(tabListTable_th_delete, tabListTable_thead_tr);
  writer.append(tabListTable_thead_tr, tabListTable_thead);

  writer.append(tabTitle, tabListTable_td);
  writer.append(tabListTable_td, tabListTable_tbody_tr);
  writer.append(tabListTable_tbody_tr, tabListTable_tbody);

  writer.append(tabListTable_thead, tabListTable);
  writer.append(tabListTable_tbody, tabListTable);
  writer.append(tabListTable, tabListItemLabelDiv);
  writer.append(tabListItemLabelDiv, tabListItem);

  return tabListItem;
}

// Creates a "Move Left" button for a tab.
export function createMoveLeftButton(writer, dataIndex, pluginId) {
  return writer.createElement('moveLeftButton', { 'data-index': dataIndex, 'data-plugin-id': pluginId });
}

// Creates a "Move Right" button for a tab.
export function createMoveRightButton(writer, dataIndex, pluginId) {
  return writer.createElement('moveRightButton', { 'data-index': dataIndex, 'data-plugin-id': pluginId });
}

// Creates a "Delete Tab" button for a tab.
export function createDeleteTabButton(writer, dataIndex, pluginId) {
  const deleteTabButton = writer.createElement('deleteTabButton', { 'data-index': dataIndex, 'data-plugin-id': pluginId });
  const deleteTabButtonParagraph = writer.createElement('deleteTabButtonParagraph');
  writer.append(deleteTabButtonParagraph, deleteTabButton);
  return deleteTabButton;
}

// Creates a tabNestedContent element which represents the content for a tab.
export function createTabNestedContent(writer, content, dataIndex) {
  const tabNestedContent = writer.createElement('tabNestedContent', { 'data-index': dataIndex });
  const paragraph = writer.createElement('paragraph');
  writer.insertText(content, paragraph);
  writer.append(paragraph, tabNestedContent);
  return tabNestedContent;
}

// Creates an "Add Tab" button, which allows the user to add new tabs.
export function createAddTabButton(writer, pluginId) {
  const addTabListItem = writer.createElement('addTabListItem');
  const addTabButton = writer.createElement('addTabButton', { 'data-plugin-id': pluginId });
  const addTabIcon = writer.createElement('addTabIcon');

  writer.append(addTabIcon, addTabButton);
  writer.append(addTabButton, addTabListItem);

  return addTabListItem;
}

// Creates the complete alightTabsPlugin structure with a specified number of tabs.
export function createTabsPlugin(writer, pluginId, tabCount) {
  const alightTabsPlugin = writer.createElement('alightTabsPlugin', { 'data-plugin-id': pluginId });
  const containerDiv = writer.createElement('containerDiv');
  const tabHeader = writer.createElement('tabHeader');
  const tabList = writer.createElement('tabList');
  const tabContent = writer.createElement('tabContent');

  // Generate the specified number of tabs.
  for (let i = 0; i < tabCount; i++) {
    const { tabListItem, tabNestedContent } = createTabElement(writer, i, pluginId);
    writer.append(tabListItem, tabList);
    writer.append(tabNestedContent, tabContent);
  }

  // Append the "Add Tab" button.
  const addTabButton = createAddTabButton(writer, pluginId);
  writer.append(addTabButton, tabList);

  // Assemble the plugin structure.
  writer.append(tabList, tabHeader);
  writer.append(tabHeader, containerDiv);
  writer.append(tabContent, containerDiv);
  writer.append(containerDiv, alightTabsPlugin);

  return alightTabsPlugin;
}
// Ensures the first tab is set to active if none are active.
export function ensureFirstTabActive(editor) {
  const model = editor.model;

  model.change((writer) => {
    const tabsPlugins = Array.from(model.document.getRoot().getChildren()).filter((element) => element.is('element', 'alightTabsPlugin'));

    tabsPlugins.forEach((alightTabsPlugin) => {
      const containerDiv = alightTabsPlugin.getChild(0);
      const tabList = containerDiv?.getChild(0)?.getChild(0);
      const tabContentContainer = containerDiv?.getChild(1);

      if (!tabList || !tabContentContainer) {
        console.warn('Invalid alightTabsPlugin structure.');
        return;
      }

      const tabListItems = Array.from(tabList.getChildren()).filter((item) => !item.is('element', 'addTabListItem'));
      const tabContents = Array.from(tabContentContainer.getChildren());

      // If no tab is active, set the first tab and its content as active
      if (!tabListItems.some((item) => item.getAttribute('isActive')) && tabListItems.length > 0 && tabContents.length > 0) {
        writer.setAttribute('isActive', true, tabListItems[0]);
        writer.setAttribute('isActive', true, tabContents[0]);
      }
    });
  });
}
