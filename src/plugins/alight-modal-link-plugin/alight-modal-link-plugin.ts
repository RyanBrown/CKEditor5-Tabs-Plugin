// src/plugins/alight-modal-link-plugin/alight-modal-link-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightModalLinkPluginUI from './alight-modal-link-plugin-ui';
import AlightModalLinkPluginEditing from './alight-modal-link-plugin-editing';

export default class AlightModalLinkPlugin extends Plugin {
  static get requires() {
    return [AlightModalLinkPluginUI, AlightModalLinkPluginEditing];
  }

  static get pluginName() {
    return 'AlightModalLinkPlugin';
  }
}
