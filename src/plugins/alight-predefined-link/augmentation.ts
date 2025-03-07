/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

import type {
  LinkConfig,
  AlightPredefinedLinkAutoLink,
  AlightPredefinedLink,
  AlightPredefinedLinkEditing,
  AlightPredefinedLinkImage,
  AlightPredefinedLinkImageEditing,
  AlightPredefinedLinkImageUI,
  AlightPredefinedLinkUI,
  AlightPredefinedLinkCommand,
  AlightPredefinedLinkUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightPredefinedLink} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: LinkConfig;
  }

  interface PluginsMap {
    [AlightPredefinedLinkAutoLink.pluginName]: AlightPredefinedLinkAutoLink;
    [AlightPredefinedLink.pluginName]: AlightPredefinedLink;
    [AlightPredefinedLinkEditing.pluginName]: AlightPredefinedLinkEditing;
    [AlightPredefinedLinkImage.pluginName]: AlightPredefinedLinkImage;
    [AlightPredefinedLinkImageEditing.pluginName]: AlightPredefinedLinkImageEditing;
    [AlightPredefinedLinkImageUI.pluginName]: AlightPredefinedLinkImageUI;
    [AlightPredefinedLinkUI.pluginName]: AlightPredefinedLinkUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-predefined-link': AlightPredefinedLinkCommand;
    'alight-predefined-unlink': AlightPredefinedLinkUnlinkCommand;
  }
}