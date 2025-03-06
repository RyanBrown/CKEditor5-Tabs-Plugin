/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/alightemaillink
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightEmailLinkPluginEditing from './linkediting';
import AlightEmailLinkPluginUI from './linkui';
import AlightEmailAutoLink from './autolink';
import './styles/styles.scss';

/**
 * The Alight Email link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightEmailLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI, AlightEmailAutoLink] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLinkPlugin' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    // The UI component is already registered by AlightEmailLinkPluginUI plugin
  }
}