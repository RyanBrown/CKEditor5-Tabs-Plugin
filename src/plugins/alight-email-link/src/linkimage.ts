/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightEmailLinkImage
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightEmailLinkImageEditing from './linkimageediting';
import AlightEmailLinkImageUI from './linkimageui';

import '../theme/AlightEmailLinkImage.css';

/**
 * The `AlightEmailLinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightEmailLinkImageediting~AlightEmailLinkImageEditing link image editing feature}
 * and {@link module:link/AlightEmailLinkImageui~AlightEmailLinkImageUI link image UI feature}.
 */
export default class AlightEmailLinkImage extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [AlightEmailLinkImageEditing, AlightEmailLinkImageUI] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'AlightEmailLinkImage' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static override get isOfficialPlugin(): true {
		return true;
	}
}
