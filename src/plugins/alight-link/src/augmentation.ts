/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

import type {
  LinkConfig,
  AlightAutoLink,
  AlightLink,
  AlightLinkEditing,
  AlightLinkImage,
  AlightLinkImageEditing,
  AlightLinkImageUI,
  AlightLinkUI,
  AlightLinkCommand,
  AlightUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {

    /**
     * The configuration of the {@link module:link/link~AlightLink} feature.
     *
     * Read more in {@link module:link/linkconfig~LinkConfig}.
     */
    link?: LinkConfig;
  }

  interface PluginsMap {
    [AlightAutoLink.pluginName]: AlightAutoLink;
    [AlightLink.pluginName]: AlightLink;
    [AlightLinkEditing.pluginName]: AlightLinkEditing;
    [AlightLinkImage.pluginName]: AlightLinkImage;
    [AlightLinkImageEditing.pluginName]: AlightLinkImageEditing;
    [AlightLinkImageUI.pluginName]: AlightLinkImageUI;
    [AlightLinkUI.pluginName]: AlightLinkUI;
  }

  interface CommandsMap {
    // Use string literal for the command name to avoid conflicts
    'alight-link': AlightLinkCommand;
    'alight-unlink': AlightUnlinkCommand;
  }
}