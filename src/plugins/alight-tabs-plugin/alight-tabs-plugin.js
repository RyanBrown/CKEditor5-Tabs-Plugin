// src/plugins/alight-tabs-plugin/alight-tabs-plugin.js
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightTabsPluginEditing from './alight-tabs-plugin-editing';
import AlightTabsPluginUI from './alight-tabs-plugin-ui';

// Main TabsPlugin class extending CKEditor 5 Plugin class
export default class AlightTabsPlugin extends Plugin {
  // Plugin dependencies
  static get requires() {
    return [AlightTabsPluginEditing, AlightTabsPluginUI];
  }

  // Plugin name
  static get pluginName() {
    return 'AlightTabsPlugin';
  }
}
