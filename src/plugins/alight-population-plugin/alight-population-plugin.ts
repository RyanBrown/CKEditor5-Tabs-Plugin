// src/plugins/alight-population-plugin/alight-population-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPopulationPluginEditing from './alight-population-plugin-editing';
import AlightPopulationPluginUI from './alight-population-plugin-ui';
import AlightPopulationPluginCommand from './alight-population-plugin-command';

// Import UI components that the modal will use
import '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import '../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../ui-components/alight-radio-component/alight-radio-component';
import '../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import './styles/alight-population-plugin.scss';

/**
 * The main AlightPopulationsPlugin class that ties all plugin components together.
 * This plugin allows users to add population tags to content for conditional rendering.
 * 
 * Following the modal implementation pattern used in the predefined link plugin, this
 * uses a ContentManager with SearchManager and PaginationManager to provide a rich
 * interface for selecting population tags.
 */
export default class AlightPopulationsPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPopulationsPlugin';
  }

  /**
   * @inheritDoc
   */
  static get requires() {
    return [
      AlightPopulationPluginCommand,
      AlightPopulationPluginEditing,
      AlightPopulationPluginUI
    ];
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Initialize the plugin components in the correct order
    // First initialize the command plugin to ensure commands are registered
    const commandPlugin = editor.plugins.get('AlightPopulationPluginCommand');
    if (!commandPlugin) {
      console.error('AlightPopulationPluginCommand plugin not found');
    }

    // Then initialize the editing plugin
    const editingPlugin = editor.plugins.get('AlightPopulationPluginEditing');
    if (!editingPlugin) {
      console.error('AlightPopulationPluginEditing plugin not found');
    }

    // Finally initialize the UI plugin which depends on commands
    const uiPlugin = editor.plugins.get('AlightPopulationPluginUI');
    if (!uiPlugin) {
      console.error('AlightPopulationPluginUI plugin not found');
    }

    // Log plugin initialization for debugging
    console.log('AlightPopulationsPlugin initialized');

    // Log available commands for debugging
    console.log('Available commands:', Array.from(editor.commands.names()));
  }
}
