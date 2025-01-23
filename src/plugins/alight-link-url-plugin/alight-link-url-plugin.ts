// alight-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkUrlPluginEditing from './alight-link-url-plugin-editing';
import AlightLinkUrlPluginUI from './alight-link-url-plugin-ui';

export default class AlightLinkUrlPlugin extends Plugin {
  // Dependencies on the editing and UI plugins for links.
  static get requires() {
    return [AlightLinkUrlPluginEditing, AlightLinkUrlPluginUI];
  }

  // The plugin name.
  static get pluginName() {
    return 'AlightLinkUrlPlugin';
  }
}
