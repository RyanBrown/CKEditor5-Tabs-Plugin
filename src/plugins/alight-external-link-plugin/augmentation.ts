// src/plugins/alight-external-link-plugin/augmentation.ts
import type {
  LinkConfig,
  AlightExternalLinkPluginAutoLink,
  AlightExternalLinkPlugin,
  AlightExternalLinkPluginEditing,
  AlightExternalLinkPluginImage,
  AlightExternalLinkPluginImageEditing,
  AlightExternalLinkPluginImageUI,
  AlightExternalLinkPluginUI,
  AlightExternalLinkPluginCommand,
  AlightExternalLinkPluginUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightExternalLinkPlugin} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: LinkConfig;
  }

  interface PluginsMap {
    [AlightExternalLinkPluginAutoLink.pluginName]: AlightExternalLinkPluginAutoLink;
    [AlightExternalLinkPlugin.pluginName]: AlightExternalLinkPlugin;
    [AlightExternalLinkPluginEditing.pluginName]: AlightExternalLinkPluginEditing;
    [AlightExternalLinkPluginImage.pluginName]: AlightExternalLinkPluginImage;
    [AlightExternalLinkPluginImageEditing.pluginName]: AlightExternalLinkPluginImageEditing;
    [AlightExternalLinkPluginImageUI.pluginName]: AlightExternalLinkPluginImageUI;
    [AlightExternalLinkPluginUI.pluginName]: AlightExternalLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-external-link': AlightExternalLinkPluginCommand;
    'alight-external-unlink': AlightExternalLinkPluginUnlinkCommand;
  }
}