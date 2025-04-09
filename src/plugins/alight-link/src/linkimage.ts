/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightLinkImage
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightLinkImageEditing from './linkimageediting';
import AlightLinkImageUI from './linkimageui';

import '../theme/AlightLinkImage.css';

/**
 * The `AlightLinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightLinkImageediting~AlightLinkImageEditing link image editing feature}
 * and {@link module:link/AlightLinkImageui~AlightLinkImageUI link image UI feature}.
 */
export default class AlightLinkImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightLinkImageEditing, AlightLinkImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightLinkImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
