import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import AlightEmailLinkPluginUI from './alight-email-link-plugin-ui';

export default class AlightEmailLinkPlugin extends Plugin {
  public static get requires() {
    return [Link, AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPlugin' as const;
  }

  public init(): void {
    // Ensure Link plugin is initialized first
    this.editor.plugins.get('Link');
  }
}