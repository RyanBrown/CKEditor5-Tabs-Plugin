/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

import type {
	LinkConfig,
	AlightEmailAutoLink,
	AlightEmailLink,
	AlightEmailLinkEditing,
	AlightEmailLinkImage,
	AlightEmailLinkImageEditing,
	AlightEmailLinkImageUI,
	AlightEmailLinkUI,
	AlightEmailLinkCommand,
	AlightEmailUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
	interface EditorConfig {

		/**
		 * The configuration of the {@link module:link/link~AlightEmailLink} feature.
		 *
		 * Read more in {@link module:link/linkconfig~LinkConfig}.
		 */
		link?: LinkConfig;
	}

	interface PluginsMap {
		[AlightEmailAutoLink.pluginName]: AlightEmailAutoLink;
		[AlightEmailLink.pluginName]: AlightEmailLink;
		[AlightEmailLinkEditing.pluginName]: AlightEmailLinkEditing;
		[AlightEmailLinkImage.pluginName]: AlightEmailLinkImage;
		[AlightEmailLinkImageEditing.pluginName]: AlightEmailLinkImageEditing;
		[AlightEmailLinkImageUI.pluginName]: AlightEmailLinkImageUI;
		[AlightEmailLinkUI.pluginName]: AlightEmailLinkUI;
	}

	interface CommandsMap {
		// Use string literal for the command name to avoid conflicts
		'alight-email-link': AlightEmailLinkCommand;
		'alight-email-unlink': AlightEmailUnlinkCommand;
	}
}