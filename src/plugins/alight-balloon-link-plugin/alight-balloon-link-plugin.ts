// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightBalloonLinkPluginEditing from './alight-balloon-link-plugin-editing';
import AlightBalloonLinkPluginUI from './alight-balloon-link-plugin-ui';

export default class AlightBalloonLinkPlugin extends Plugin {
  public static get requires() {
    return [Link, AlightBalloonLinkPluginEditing, AlightBalloonLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightBalloonLinkPlugin' as const;
  }

  public init(): void {
    // Ensure Link plugin is initialized first
    this.editor.plugins.get('Link');
  }
}
