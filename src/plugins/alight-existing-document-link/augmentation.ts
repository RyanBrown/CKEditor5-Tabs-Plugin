// src/plugins/alight-existing-document-link/augmentation.ts
import type {
  LinkConfig,
  AlightExistingDocumentLinkPluginAutoLink,
  AlightExistingDocumentLinkPlugin,
  AlightExistingDocumentLinkPluginEditing,
  AlightExistingDocumentLinkPluginImage,
  AlightExistingDocumentLinkPluginImageEditing,
  AlightExistingDocumentLinkPluginImageUI,
  AlightExistingDocumentLinkPluginUI,
  AlightExistingDocumentLinkPluginCommand,
  AlightExistingDocumentLinkPluginUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightExistingDocumentLinkPlugin} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: LinkConfig;
  }

  interface PluginsMap {
    [AlightExistingDocumentLinkPluginAutoLink.pluginName]: AlightExistingDocumentLinkPluginAutoLink;
    [AlightExistingDocumentLinkPlugin.pluginName]: AlightExistingDocumentLinkPlugin;
    [AlightExistingDocumentLinkPluginEditing.pluginName]: AlightExistingDocumentLinkPluginEditing;
    [AlightExistingDocumentLinkPluginImage.pluginName]: AlightExistingDocumentLinkPluginImage;
    [AlightExistingDocumentLinkPluginImageEditing.pluginName]: AlightExistingDocumentLinkPluginImageEditing;
    [AlightExistingDocumentLinkPluginImageUI.pluginName]: AlightExistingDocumentLinkPluginImageUI;
    [AlightExistingDocumentLinkPluginUI.pluginName]: AlightExistingDocumentLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-existing-document-link': AlightExistingDocumentLinkPluginCommand;
    'alight-existing-document-unlink': AlightExistingDocumentLinkPluginUnlinkCommand;
  }
}
