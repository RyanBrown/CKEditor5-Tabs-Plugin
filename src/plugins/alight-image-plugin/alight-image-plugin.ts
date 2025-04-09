// src/plugins/alight-image-plugin/alight-image-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightImagePluginUI from './alight-image-plugin-ui';
import AlightImagePluginEditing from './alight-image-plugin-editing';

export default class AlightImagePlugin extends Plugin {
  static get requires() {
    return [AlightImagePluginUI, AlightImagePluginEditing];
  }

  static get pluginName() {
    return 'AlightImagePlugin';
  }
}
