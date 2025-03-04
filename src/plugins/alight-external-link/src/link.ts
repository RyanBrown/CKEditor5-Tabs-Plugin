/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/link
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightExternalLinkEditing from './linkediting';
import AlightExternalLinkUI from './linkui';
import AlightExternalLinkAutoLink from './autolink';

/**
 * The link plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkediting~AlightExternalLinkEditing link editing feature}
 * and {@link module:link/linkui~AlightExternalLinkUI link UI feature}.
 */
export default class AlightExternalLink extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [AlightExternalLinkEditing, AlightExternalLinkUI, AlightExternalLinkAutoLink] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'AlightExternalLink' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static override get isOfficialPlugin(): true {
		return true;
	}
}