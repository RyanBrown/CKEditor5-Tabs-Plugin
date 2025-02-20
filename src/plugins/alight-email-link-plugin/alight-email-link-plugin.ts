// src/plugins/alight-email-link-plugin/alight-email-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import AlightEmailLinkPluginUI from './alight-email-link-plugin-plugin-ui';

export default class AlightEmailLinkPlugin extends Plugin {
  public static get requires() {
    return [AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI, Link] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPlugin' as const;
  }
}
