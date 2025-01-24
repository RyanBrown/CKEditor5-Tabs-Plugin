// src/plugins/alight-link-plugin/alight-link-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkPluginUI from './alight-link-plugin-ui';
import AlightLinkPluginEditing from './alight-link-plugin-editing';

export default class AlightLinkPlugin extends Plugin {
  static get requires() {
    return [AlightLinkPluginUI, AlightLinkPluginEditing];
  }

  static get pluginName() {
    return 'AlightLinkPlugin';
  }
}
