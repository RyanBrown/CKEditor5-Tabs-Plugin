// src/plugins/alight-predefined-link-plugin/augmentation.ts
import type {
  LinkConfig,
  AlightPredefinedLinkPluginAutoLink,
  AlightPredefinedLinkPlugin,
  AlightPredefinedLinkPluginEditing,
  AlightPredefinedLinkPluginUI,
  AlightPredefinedLinkPluginCommand,
  AlightPredefinedLinkPluginUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
   * The configuration of the {@link module:link/link~AlightPredefinedLinkPlugin} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: LinkConfig;
  }

  interface PluginsMap {
    'AlightPredefinedLinkPluginAutoLink.pluginName': AlightPredefinedLinkPluginAutoLink;
    'AlightPredefinedLinkPlugin.pluginName': AlightPredefinedLinkPlugin;
    'AlightPredefinedLinkPluginEditing.pluginName': AlightPredefinedLinkPluginEditing;
    'AlightPredefinedLinkPluginUI.pluginName': AlightPredefinedLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-predefined-link': AlightPredefinedLinkPluginCommand;
    'alight-predefined-unlink': AlightPredefinedLinkPluginUnlinkCommand;
  }
}
