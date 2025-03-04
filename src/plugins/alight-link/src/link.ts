/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/link
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightLinkEditing from './linkediting';
import AlightLinkUI from './linkui';
import AlightAutoLink from './autolink';

/**
 * The link plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkediting~AlightLinkEditing link editing feature}
 * and {@link module:link/linkui~AlightLinkUI link UI feature}.
 */
export default class AlightLink extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [AlightLinkEditing, AlightLinkUI, AlightAutoLink] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'AlightLink' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static override get isOfficialPlugin(): true {
		return true;
	}
}