/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightExternalLinkImage
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExternalLinkImageEditing from './linkimageediting';
import AlightExternalLinkImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightExternalLinkImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightExternalLinkImageediting~AlightExternalLinkImageEditing link image editing feature}
 * and {@link module:link/AlightExternalLinkImageui~AlightExternalLinkImageUI link image UI feature}.
 */
export default class AlightExternalLinkImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkImageEditing, AlightExternalLinkImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
