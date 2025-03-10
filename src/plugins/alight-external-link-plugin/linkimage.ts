// src/plugins/alight-external-link-plugin/linkimage.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExternalLinkPluginImageEditing from './linkimageediting';
import AlightExternalLinkPluginImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightExternalLinkPluginImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightExternalLinkPluginImageediting~AlightExternalLinkPluginImageEditing link image editing feature}
 * and {@link module:link/AlightExternalLinkPluginImageui~AlightExternalLinkPluginImageUI link image UI feature}.
 */
export default class AlightExternalLinkPluginImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkPluginImageEditing, AlightExternalLinkPluginImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkPluginImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
