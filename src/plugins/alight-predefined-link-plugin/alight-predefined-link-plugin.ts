// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPredefinedLinkPluginEditing from './alight-predefined-link-plugin-editing';
import AlightPredefinedLinkPluginUI from './alight-predefined-link-plugin-ui';

export default class AlightPredefinedLinkPlugin extends Plugin {
  public static get requires() {
    return [Link, AlightPredefinedLinkPluginEditing, AlightPredefinedLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightPredefinedLinkPlugin' as const;
  }

  public init(): void {
    // Ensure Link plugin is initialized first
    this.editor.plugins.get('Link');
  }
}
