// src/plugins/alight-public-link-plugin/alight-public-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPublicLinkPluginEditing from './alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from './alight-public-link-plugin-ui';

export default class AlightPublicLinkPlugin extends Plugin {
  public static get pluginName() {
    return 'AlightPublicLinkPlugin' as const;
  }

  public static get requires() {
    return [AlightPublicLinkPluginEditing, AlightPublicLinkPluginUI] as const;
  }
}
