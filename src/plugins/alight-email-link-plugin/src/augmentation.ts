/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

import type {
  LinkConfig,
  AlightEmailAutoLink,
  AlightEmailLinkPlugin,
  AlightEmailLinkPluginEditing,
  AlightEmailLinkPluginImage,
  AlightEmailLinkPluginImageEditing,
  AlightEmailLinkPluginImageUI,
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
    link?: LinkConfig;
  }

  interface PluginsMap {
    [AlightEmailAutoLink.pluginName]: AlightEmailAutoLink;
    [AlightEmailLinkPlugin.pluginName]: AlightEmailLinkPlugin;
    [AlightEmailLinkPluginEditing.pluginName]: AlightEmailLinkPluginEditing;
    [AlightEmailLinkPluginImage.pluginName]: AlightEmailLinkPluginImage;
    [AlightEmailLinkPluginImageEditing.pluginName]: AlightEmailLinkPluginImageEditing;
    [AlightEmailLinkPluginImageUI.pluginName]: AlightEmailLinkPluginImageUI;
    [AlightEmailLinkPluginUI.pluginName]: AlightEmailLinkPluginUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-email-link': AlightEmailLinkPluginCommand;
    'alight-email-unlink': AlightEmailUnlinkCommand;
  }
}