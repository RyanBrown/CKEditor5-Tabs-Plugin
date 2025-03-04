/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

import type {
	LinkConfig,
	AlightExternalLinkAutoLink,
	AlightExternalLink,
	AlightExternalLinkEditing,
	AlightExternalLinkImage,
	AlightExternalLinkImageEditing,
	AlightExternalLinkImageUI,
	AlightExternalLinkUI,
	AlightExternalLinkCommand,
	AlightExternalLinkUnlinkCommand
} from './index';

declare module '@ckeditor/ckeditor5-core' {
	interface EditorConfig {

		/**
		 * The configuration of the {@link module:link/link~AlightExternalLink} feature.
		 *
		 * Read more in {@link module:link/linkconfig~LinkConfig}.
		 */
		link?: LinkConfig;
	}

	interface PluginsMap {
		[AlightExternalLinkAutoLink.pluginName]: AlightExternalLinkAutoLink;
		[AlightExternalLink.pluginName]: AlightExternalLink;
		[AlightExternalLinkEditing.pluginName]: AlightExternalLinkEditing;
		[AlightExternalLinkImage.pluginName]: AlightExternalLinkImage;
		[AlightExternalLinkImageEditing.pluginName]: AlightExternalLinkImageEditing;
		[AlightExternalLinkImageUI.pluginName]: AlightExternalLinkImageUI;
		[AlightExternalLinkUI.pluginName]: AlightExternalLinkUI;
	}

	interface CommandsMap {
		// Use string literal for the command name to avoid conflicts
		'alight-external-link': AlightExternalLinkCommand;
		'alight-external-unlink': AlightExternalLinkUnlinkCommand;
	}
}