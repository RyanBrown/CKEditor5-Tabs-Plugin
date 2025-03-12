// src/plugins/alight-email-link-plugin/augmentation.ts
import type {
  AlightEmailLinkConfig,
  AlightEmailAutoLink,
  AlightEmailLinkPlugin,
  AlightEmailLinkPluginEditing,
  AlightEmailLinkPluginUI,
  AlightEmailLinkPluginCommand,
  AlightEmailUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightEmailLinkPlugin} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: AlightEmailLinkConfig;
  }

  interface PluginsMap {
    [AlightEmailAutoLink.pluginName]: AlightEmailAutoLink;
    [AlightEmailLinkPlugin.pluginName]: AlightEmailLinkPlugin;
    [AlightEmailLinkPluginEditing.pluginName]: AlightEmailLinkPluginEditing;
    [AlightEmailLinkPluginUI.pluginName]: AlightEmailLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-email-link': AlightEmailLinkPluginCommand;
    'alight-email-unlink': AlightEmailUnlinkCommand;
  }
}
