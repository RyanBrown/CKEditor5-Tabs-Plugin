// src/plugins/alight-new-document-link-plugin/augmentation.ts
import type {
  AlightNewDocumentLinkConfig,
  AlightNewDocumentAutoLink,
  AlightNewDocumentLinkPlugin,
  AlightNewDocumentLinkPluginEditing,
  AlightNewDocumentLinkPluginUI,
  AlightNewDocumentLinkPluginCommand,
  AlightNewDocumentUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightNewDocumentLinkPlugin} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: AlightNewDocumentLinkConfig;
  }

  interface PluginsMap {
    [AlightNewDocumentAutoLink.pluginName]: AlightNewDocumentAutoLink;
    [AlightNewDocumentLinkPlugin.pluginName]: AlightNewDocumentLinkPlugin;
    [AlightNewDocumentLinkPluginEditing.pluginName]: AlightNewDocumentLinkPluginEditing;
    [AlightNewDocumentLinkPluginUI.pluginName]: AlightNewDocumentLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-new-document-link': AlightNewDocumentLinkPluginCommand;
    'alight-new-document-unlink': AlightNewDocumentUnlinkCommand;
  }
}
