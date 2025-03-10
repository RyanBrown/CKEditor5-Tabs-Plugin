// src/plugins/alight-email-link-plugin/linkimage.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
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
