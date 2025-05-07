// src/plugins/alight-existing-document-link/augmentation.ts
import type {
  LinkConfig,
  AlightExistingDocumentLinkPluginAutoLink,
  AlightExistingDocumentLinkPlugin,
  AlightExistingDocumentLinkPluginEditing,
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
    'AlightExistingDocumentLinkPluginAutoLink': AlightExistingDocumentLinkPluginAutoLink;
    'AlightExistingDocumentLinkPlugin': AlightExistingDocumentLinkPlugin;
    'AlightExistingDocumentLinkPluginEditing': AlightExistingDocumentLinkPluginEditing;
    'AlightExistingDocumentLinkPluginUI': AlightExistingDocumentLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-existing-document-link': AlightExistingDocumentLinkPluginCommand;
    'alight-existing-document-unlink': AlightExistingDocumentLinkPluginUnlinkCommand;
  }
}
