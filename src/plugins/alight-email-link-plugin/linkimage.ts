/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightEmailLinkPluginImage
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightEmailLinkPluginImageEditing from './linkimageediting';
import AlightEmailLinkPluginImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightEmailLinkPluginImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightEmailLinkPluginImageediting~AlightEmailLinkPluginImageEditing link image editing feature}
 * and {@link module:link/AlightEmailLinkPluginImageui~AlightEmailLinkPluginImageUI link image UI feature}.
 */
export default class AlightEmailLinkPluginImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkPluginImageEditing, AlightEmailLinkPluginImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLinkPluginImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
