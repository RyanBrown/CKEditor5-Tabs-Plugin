// src/plugins/alight-population-plugin/alight-population-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightPopulationPluginUI from './alight-population-plugin-ui';
import AlightPopulationPluginEditing from './alight-population-plugin-editing';

export default class AlightPopulationPlugin extends Plugin {
  static get requires() {
    return [AlightPopulationPluginUI, AlightPopulationPluginEditing];
  }

  static get pluginName() {
    return 'AlightPopulationPlugin';
  }
}