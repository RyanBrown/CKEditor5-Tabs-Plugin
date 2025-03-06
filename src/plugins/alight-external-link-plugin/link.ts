/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/link
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExternalLinkPluginEditing from './linkediting';
import AlightExternalLinkPluginUI from './linkui';
import AlightExternalLinkPluginAutoLink from './autolink';

/**
 * The link plugin.
 *
 * This is a "glue" plugin that loads the {@link module:link/linkediting~AlightExternalLinkPluginEditing link editing feature}
 * and {@link module:link/linkui~AlightExternalLinkPluginUI link UI feature}.
 */
export default class AlightExternalLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkPluginEditing, AlightExternalLinkPluginUI, AlightExternalLinkPluginAutoLink] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkPlugin' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }
}