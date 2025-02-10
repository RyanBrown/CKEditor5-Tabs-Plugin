// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin.ts

// If you'd like a default export:
// export default class AlightCustomModalLinkPlugin extends Plugin {
import { Plugin } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginEditing } from './alight-custom-modal-link-plugin-editing';
import { AlightCustomModalLinkPluginUI } from './alight-custom-modal-link-plugin-ui';

export default class AlightCustomModalLinkPlugin extends Plugin {
  public static get requires() {
    return [AlightCustomModalLinkPluginEditing, AlightCustomModalLinkPluginUI];
  }

  public static get pluginName() {
    return 'AlightCustomModalLinkPlugin';
  }
}
