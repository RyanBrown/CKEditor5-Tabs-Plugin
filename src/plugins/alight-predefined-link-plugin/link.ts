// src/plugins/alight-predefined-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightPredefinedLinkPluginEditing from './linkediting';
import AlightPredefinedLinkPluginUI from './linkui';
import AlightPredefinedLinkPluginAutoLink from './autolink';
import './styles/alight-predefined-link-plugin.scss';

/**
 * The Alight Predefined link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightPredefinedLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightPredefinedLinkPluginEditing, AlightPredefinedLinkPluginUI, AlightPredefinedLinkPluginAutoLink] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkPlugin' as const;
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
    // The UI component is already registered by AlightPredefinedLinkPluginUI plugin
  }
}
