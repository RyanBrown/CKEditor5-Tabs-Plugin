// src/plugins/alight-generic-link-plugin/alight-generic-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightGenericLinkPluginEditing from './alight-generic-link-plugin-editing';
import AlightGenericLinkPluginUI from './alight-generic-link-plugin-ui';

export default class AlightGenericLinkPlugin extends Plugin {
  public static get requires() {
    return [Link, AlightGenericLinkPluginEditing, AlightGenericLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightGenericLinkPlugin' as const;
  }

  public init(): void {
    // This ensures that the Link plugin is loaded and available
    this.editor.plugins.get('Link');
  }
}
