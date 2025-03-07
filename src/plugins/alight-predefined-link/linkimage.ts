/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightPredefinedLinkImage
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPredefinedLinkImageEditing from './linkimageediting';
import AlightPredefinedLinkImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightPredefinedLinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightPredefinedLinkImageediting~AlightPredefinedLinkImageEditing link image editing feature}
 * and {@link module:link/AlightPredefinedLinkImageui~AlightPredefinedLinkImageUI link image UI feature}.
 */
export default class AlightPredefinedLinkImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightPredefinedLinkImageEditing, AlightPredefinedLinkImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
