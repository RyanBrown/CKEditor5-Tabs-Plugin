// src/alight-common/alight-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightEditor from '../ckeditor';
import { LinkPluginConfig } from '../plugins/alight-parent-link-plugin';
import { LinkPluginId } from './link-plugin-id';

export abstract class AlightPlugin extends Plugin {

  public static get pluginName(): string { return 'AlightPlugin' as const; }
  public abstract get pluginName(): string;
  public abstract get pluginId(): LinkPluginId;

  public override editor: AlightEditor = this.editor as AlightEditor;

  protected linkPluginsConfig = this.editor.config.get('alightParentLinkPlugin.linkPlugin') as LinkPluginConfig[] | undefined;
  protected get isConfigureActive(): boolean {
    return this.linkPluginsConfig.find(plugin => plugin.uiName === this.pluginName).enabled;
  }
}