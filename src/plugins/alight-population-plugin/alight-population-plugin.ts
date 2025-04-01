// src/plugins/alight-population-plugin/alight-population-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPopulationPluginEditing from './alight-population-plugin-editing';
import AlightPopulationPluginUI from './alight-population-plugin-ui';
import AlightPopulationPluginCommand from './alight-population-plugin-command';

/**
 * The main AlightPopulationsPlugin class that ties all plugin components together.
 * This plugin allows users to add population tags to content for conditional rendering.
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

    // Log plugin initialization for debugging
    console.log('AlightPopulationsPlugin initialized');
  }
}