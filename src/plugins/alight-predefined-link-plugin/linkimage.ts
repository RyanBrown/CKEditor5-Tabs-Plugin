/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightPredefinedLinkPluginImage
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPredefinedLinkPluginImageEditing from './linkimageediting';
import AlightPredefinedLinkPluginImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightPredefinedLinkPluginImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightPredefinedLinkPluginImageediting~AlightPredefinedLinkPluginImageEditing link image editing feature}
 * and {@link module:link/AlightPredefinedLinkPluginImageui~AlightPredefinedLinkPluginImageUI link image UI feature}.
 */
export default class AlightPredefinedLinkPluginImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightPredefinedLinkPluginImageEditing, AlightPredefinedLinkPluginImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
