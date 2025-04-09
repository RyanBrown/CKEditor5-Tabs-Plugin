// src/plugins/alight-tabs-plugin/alight-tabs-plugin-utils.js
import { Command } from '@ckeditor/ckeditor5-core';
import { createTabElement, createTabsPlugin, generatePluginId, tabsPluginMap } from './alight-tabs-plugin-utils';

let counter = 0;

// Command to insert a new TabsPlugin instance into the editor.
export default class AlightTabsPluginCommand extends Command {
  execute({ tabCount } = {}) {
    const defaultTabCount = this.editor.config.get('alightTabsPlugin.defaultTabCount') || 2;
    this.editor.model.change((writer) => {
      const pluginId = generatePluginId(); // Generate a unique ID for each TabsPlugin instance
      const alightTabsPlugin = createTabsPlugin(writer, pluginId, tabCount || defaultTabCount);

      writer.setAttribute('data-plugin-id', pluginId, alightTabsPlugin); // Attach the pluginId as an attribute
      tabsPluginMap.set(pluginId, alightTabsPlugin); // Store the plugin instance in the map
      this.editor.model.insertContent(alightTabsPlugin); // Insert the TabsPlugin content into the editor

      // Set the first tab as active by default
      this.editor.execute('setActiveTab', { pluginId, tabIndex: 0 });

      // console.log('TabsPlugin inserted with pluginId:', pluginId);
    });
  }

  // Determines whether the command can be executed in the current editor context.
  refresh() {
    const selection = this.editor.model.document.selection;
    this.isEnabled = !!this.editor.model.schema.findAllowedParent(selection.getFirstPosition(), 'alightTabsPlugin');
  }
}

// Command to move a tab within its tab list.
export class MoveTabCommand extends Command {
  execute({ pluginId, tabIndex, direction } = {}) {
    if (!pluginId) {
      console.warn('MoveTabCommand: Missing pluginId.');
      return;
    }

    const alightTabsPlugin = tabsPluginMap.get(pluginId);
    if (!alightTabsPlugin) {
      console.warn(`MoveTabCommand: No alightTabsPlugin found with pluginId ${pluginId}.`);
      return;
    }

    const tabList = alightTabsPlugin.getChild(0)?.getChild(0)?.getChild(0);
    const tabContentContainer = alightTabsPlugin.getChild(0)?.getChild(1);

    if (!tabList || !tabContentContainer) {
      console.warn('MoveTabCommand: Invalid alightTabsPlugin structure.');
      return;
    }

    const tabListItem = Array.from(tabList.getChildren()).find((item) => parseInt(item.getAttribute('data-index'), 10) === tabIndex);
    const tabNestedContent = Array.from(tabContentContainer.getChildren()).find((content) => parseInt(content.getAttribute('data-index'), 10) === tabIndex);

    if (!tabListItem || !tabNestedContent) {
      console.warn(`MoveTabCommand: Tab or content not found for tabIndex ${tabIndex}.`);
      return;
    }

    const currentIndex = tabList.getChildIndex(tabListItem);
    const targetIndex = currentIndex + direction;

    if (targetIndex < 0 || targetIndex >= tabList.childCount) {
      console.warn(`MoveTabCommand: Cannot move tabIndex ${tabIndex} in direction ${direction}.`);
      return;
    }

    const targetTabListItem = tabList.getChild(targetIndex);
    const targetTabContent = tabContentContainer.getChild(targetIndex);

    this.editor.model.change((writer) => {
      // Determine the insertion position based on the direction
      let position;
      if (direction === -1) {
        // Moving Left: Insert before the target
        position = writer.createPositionBefore(targetTabListItem);
      } else if (direction === 1) {
        // Moving Right: Insert after the target
        position = writer.createPositionAfter(targetTabListItem);
      } else {
        console.warn(`MoveTabCommand: Invalid direction ${direction}.`);
        return;
      }

      // Move the tab list item
      writer.move(writer.createRangeOn(tabListItem), position);

      // Move the corresponding tab content.
      if (direction === -1) {
        writer.move(writer.createRangeOn(tabNestedContent), writer.createPositionBefore(targetTabContent));
      } else if (direction === 1) {
        writer.move(writer.createRangeOn(tabNestedContent), writer.createPositionAfter(targetTabContent));
      }
    });
  }

  // Determines whether the command can be executed in the current editor context.
  refresh() {
    const selection = this.editor.model.document.selection;
    this.isEnabled = !!this.editor.model.schema.findAllowedParent(selection.getFirstPosition(), 'alightTabsPlugin');
  }
}

// Command to delete a tab from its TabsPlugin instance.
export class DeleteTabCommand extends Command {
  execute({ pluginId, tabIndex } = {}) {
    console.log(`DeleteTabCommand.execute called with pluginId: ${pluginId}, tabIndex: ${tabIndex}`);

    if (!pluginId) {
      console.warn('DeleteTabCommand: Missing pluginId.');
      return;
    }

    const alightTabsPlugin = tabsPluginMap.get(pluginId);
    if (!alightTabsPlugin) {
      console.warn(`DeleteTabCommand: No alightTabsPlugin found with pluginId ${pluginId}.`);
      return;
    }

    const tabList = alightTabsPlugin.getChild(0)?.getChild(0)?.getChild(0);
    const tabContentContainer = alightTabsPlugin.getChild(0)?.getChild(1);

    if (!tabList || !tabContentContainer) {
      console.warn('DeleteTabCommand: Invalid alightTabsPlugin structure.');
      return;
    }

    const itemToDelete = Array.from(tabList.getChildren()).find((item) => parseInt(item.getAttribute('data-index'), 10) === tabIndex);
    const contentToDelete = Array.from(tabContentContainer.getChildren()).find((content) => parseInt(content.getAttribute('data-index'), 10) === tabIndex);

    if (!itemToDelete || !contentToDelete) {
      console.warn(`DeleteTabCommand: Tab or content not found for tabIndex ${tabIndex}.`);
      return;
    }

    this.editor.model.change((writer) => {
      // Check the number of tabs excluding the "Add Tab" button.
      const actualTabCount = Array.from(tabList.getChildren()).filter((child) => !child.is('element', 'addTabListItem')).length;
      // console.log('Actual Tab Count (excluding addTabListItem):', actualTabCount);

      if (actualTabCount <= 1) {
        // If only one tab remains, remove the entire plugin.
        // console.log('Only one tab left. Removing the entire alightTabsPlugin.');

        // Move selection after the plugin to avoid schema issues
        const positionAfter = writer.createPositionAfter(alightTabsPlugin);
        writer.setSelection(positionAfter);

        // Remove the plugin
        writer.remove(alightTabsPlugin);
        tabsPluginMap.delete(pluginId);
        // console.log(`DeleteTabCommand: Removed entire TabsPlugin with pluginId ${pluginId} as it only had one tab.`);
      } else {
        // Remove the selected tab and its content.
        const isActive = itemToDelete.getAttribute('isActive');
        // Get the position (index) of itemToDelete among tab items
        const tabItems = Array.from(tabList.getChildren()).filter((item) => !item.is('element', 'addTabListItem'));
        const itemToDeletePosition = tabItems.indexOf(itemToDelete);

        writer.remove(itemToDelete);
        writer.remove(contentToDelete);
        console.log(`DeleteTabCommand: Removed tab ${tabIndex} from pluginId ${pluginId}.`);

        if (isActive) {
          // Activate a new tab if the deleted one was active.
          const remainingTabs = Array.from(tabList.getChildren()).filter((item) => !item.is('element', 'addTabListItem'));
          let newActiveTab = remainingTabs[itemToDeletePosition > 0 ? itemToDeletePosition - 1 : 0];
          const newActiveIndex = parseInt(newActiveTab.getAttribute('data-index'), 10);
          this.editor.execute('setActiveTab', { pluginId, tabIndex: newActiveIndex });
        }
      }
    });
  }
  // Determines whether the command can be executed in the current editor context.
  refresh() {
    const selection = this.editor.model.document.selection;
    this.isEnabled = !!this.editor.model.schema.findAllowedParent(selection.getFirstPosition(), 'alightTabsPlugin');
  }
}

// Command to add a new tab to a TabsPlugin instance.
export class AddTabCommand extends Command {
  execute({ pluginId } = {}) {
    // console.log(`AddTabCommand.execute called with pluginId: ${pluginId}`);

    if (!pluginId) {
      console.warn('AddTabCommand: Missing pluginId.');
      return;
    }

    const alightTabsPlugin = tabsPluginMap.get(pluginId);
    if (!alightTabsPlugin) {
      console.warn(`AddTabCommand: No alightTabsPlugin found with pluginId ${pluginId}.`);
      return;
    }

    const containerDiv = alightTabsPlugin.getChild(0);
    const tabList = containerDiv?.getChild(0)?.getChild(0);
    const tabContent = containerDiv?.getChild(1);

    if (!tabList || !tabContent) {
      console.warn('AddTabCommand: Invalid alightTabsPlugin structure.');
      return;
    }

    this.editor.model.change((writer) => {
      // Determine the next available tab index.
      const existingTabs = Array.from(tabList.getChildren()).filter((child) => !child.is('addTabListItem'));
      const indices = existingTabs
        .map((child) => parseInt(child.getAttribute('data-index'), 10))
        .filter((index) => !isNaN(index))
        .sort((a, b) => a - b);

      // Find the first gap in the indices
      let newTabIndex = 0;
      for (let i = 0; i <= indices.length; i++) {
        if (indices[i] !== i) {
          newTabIndex = i;
          break;
        }
      }
      // console.log(`AddTabCommand: Calculated newTabIndex as ${newTabIndex}`);

      // Create new tab elements
      const { tabListItem, tabNestedContent } = createTabElement(writer, newTabIndex, pluginId);
      console.log(`AddTabCommand: Created new tab elements with data-index=${newTabIndex}`);

      // Deactivate all other tabs
      existingTabs.forEach((tab) => writer.setAttribute('isActive', false, tab));
      Array.from(tabContent.getChildren()).forEach((content) => writer.setAttribute('isActive', false, content));

      // Activate the new tab
      writer.setAttribute('isActive', true, tabListItem);
      writer.setAttribute('isActive', true, tabNestedContent);

      // Insert the new tab before the "Add Tab" button.
      const addTabButton = Array.from(tabList.getChildren()).find((child) => child.is('element', 'addTabListItem'));
      if (addTabButton) {
        writer.insert(tabListItem, writer.createPositionBefore(addTabButton));
        // console.log('AddTabCommand: Inserted new tabListItem before addTabButton.');
      } else {
        writer.append(tabListItem, tabList);
        console.log('AddTabCommand: Appended new tabListItem to tabList.');
      }

      // Append the corresponding content for the new tab
      writer.append(tabNestedContent, tabContent);
      // console.log('AddTabCommand: Appended new tabNestedContent.');
    });
  }
}

// Command to set a specific tab as active.
export class SetActiveTabCommand extends Command {
  execute({ pluginId, tabIndex } = {}) {
    console.log(`SetActiveTabCommand.execute called with pluginId: ${pluginId}, tabIndex: ${tabIndex}`);

    if (!pluginId) {
      console.warn('SetActiveTabCommand: Missing pluginId.');
      return;
    }

    const alightTabsPlugin = tabsPluginMap.get(pluginId);
    if (!alightTabsPlugin) {
      console.warn(`SetActiveTabCommand: No alightTabsPlugin found with pluginId ${pluginId}.`);
      return;
    }

    const tabList = alightTabsPlugin.getChild(0)?.getChild(0)?.getChild(0); // Locate tab list
    const tabContentContainer = alightTabsPlugin.getChild(0)?.getChild(1); // Locate tab content container

    if (!tabList || !tabContentContainer) {
      console.warn('SetActiveTabCommand: Invalid alightTabsPlugin structure.');
      return;
    }

    this.editor.model.change((writer) => {
      // Deactivate all tabs and contents
      Array.from(tabList.getChildren()).forEach((item) => writer.setAttribute('isActive', false, item));
      Array.from(tabContentContainer.getChildren()).forEach((content) => writer.setAttribute('isActive', false, content));

      // Activate the specified tab and content
      const tabListItem = Array.from(tabList.getChildren()).find((item) => parseInt(item.getAttribute('data-index'), 10) === tabIndex);
      const tabNestedContent = Array.from(tabContentContainer.getChildren()).find((content) => parseInt(content.getAttribute('data-index'), 10) === tabIndex);

      if (tabListItem && tabNestedContent) {
        writer.setAttribute('isActive', true, tabListItem);
        writer.setAttribute('isActive', true, tabNestedContent);
        // console.log(`SetActiveTabCommand: Tab data-index="${tabIndex}" is now active.`);
      } else {
        console.warn(`SetActiveTabCommand: Tab or content not found for tabIndex ${tabIndex}.`);
      }
    });
  }
}
