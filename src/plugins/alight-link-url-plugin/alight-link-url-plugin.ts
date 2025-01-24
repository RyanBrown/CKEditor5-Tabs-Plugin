// src/plugins/alight-link-url-plugin/alight-link-url-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkUrlPluginEditing from './alight-link-url-plugin-editing';
import AlightLinkUrlPluginUI from './alight-link-url-plugin-ui';

export default class AlightLinkUrlPlugin extends Plugin {
  static get requires() {
    return [AlightLinkUrlPluginEditing, AlightLinkUrlPluginUI];
  }

  static get pluginName() {
    return 'AlightLinkUrlPlugin';
  }
}
