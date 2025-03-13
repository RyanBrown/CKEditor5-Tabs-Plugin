// src/plugins/alight-existing-document-link/linkimage.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExistingDocumentLinkPluginImageEditing from './linkimageediting';
import AlightExistingDocumentLinkPluginImageUI from './linkimageui';

import '@ckeditor/ckeditor5-link/theme/linkimage.css';

/**
 * The `AlightExistingDocumentLinkPluginImage` plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/AlightExistingDocumentLinkPluginImageediting~AlightExistingDocumentLinkPluginImageEditing link image editing feature}
 * and {@link module:link/AlightExistingDocumentLinkPluginImageui~AlightExistingDocumentLinkPluginImageUI link image UI feature}.
 */
export default class AlightExistingDocumentLinkPluginImage extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExistingDocumentLinkPluginImageEditing, AlightExistingDocumentLinkPluginImageUI] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExistingDocumentLinkPluginImage' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}
