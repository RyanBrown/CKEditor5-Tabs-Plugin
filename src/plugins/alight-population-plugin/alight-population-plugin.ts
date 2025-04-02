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
      AlightPopulationPluginEditing,
      AlightPopulationPluginUI,
      AlightPopulationPluginCommand
    ];
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Initialize the plugin components
    editor.plugins.get('AlightPopulationPluginEditing');
    editor.plugins.get('AlightPopulationPluginUI');
    editor.plugins.get('AlightPopulationPluginCommand');

    // Register the UI components in the editor's UI component factory
    this._registerUIComponents();

    // Log plugin initialization for debugging
    console.log('AlightPopulationsPlugin initialized');
  }

  /**
   * Registers the UI components needed for the population modal.
   * This ensures that all required components are available when the modal is displayed.
   */
  private _registerUIComponents() {
    const editor = this.editor;

    // Register the alightPopulationPlugin button in the editor's UI component factory
    // This is already handled in AlightPopulationPluginUI

    // Register the removePopulation button in the editor's UI component factory
    // This is already handled in AlightPopulationPluginUI

    // Register the openPopulationModal command in the editor's command collection
    // This is already handled in AlightPopulationPluginUI

    // The CkAlightModalDialog component is registered globally through the import
    // The other UI components are also registered globally through imports
  }
}
