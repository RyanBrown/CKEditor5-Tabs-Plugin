// src/alight-common/alight-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightEditor from '../ckeditor';
import { LinkPluginConfig } from '../plugins/alight-parent-link-plugin';

export abstract class AlightPlugin extends Plugin {

  public static get pluginName(): string { return 'AlightPlugin' as const; }
  public abstract get pluginName(): string;
  public abstract get pluginId(): string;

  public override editor: AlightEditor = this.editor as AlightEditor;

  protected linkPluginsConfig = this.editor.config.get('toolbar.items');
  protected parentLinkPluginsConfig = this.editor.config.get('alightParentLinkPlugin.linkPlugins') as LinkPluginConfig[] | undefined;
  public get isConfiguredActive(): boolean {
    return this.linkPluginsConfig.find(item => item.toString().toLowerCase() === this.pluginName.toLowerCase()) != null
      || this.parentLinkPluginsConfig.find(plugin => plugin.uiName === this.pluginName)?.enabled;
  }
}
