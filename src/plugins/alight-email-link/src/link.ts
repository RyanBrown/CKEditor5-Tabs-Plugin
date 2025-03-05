/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/alightemaillink
 */

import { Plugin } from 'ckeditor5/src/core';
import AlightEmailLinkEditing from './linkediting';
import AlightEmailLinkUI from './linkui';
import AlightEmailAutoLink from './autolink';

/**
 * The Alight Email link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightEmailLink extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkEditing, AlightEmailLinkUI, AlightEmailAutoLink] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLink' as const;
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
    // The UI component is already registered by AlightEmailLinkUI plugin
  }
}