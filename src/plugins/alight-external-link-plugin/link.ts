// src/plugins/alight-external-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExternalLinkPluginEditing from './linkediting';
import AlightExternalLinkPluginUI from './linkui';
import AlightExternalLinkPluginAutoLink from './autolink';
import './styles/alight-external-link-plugin.scss';

/**
 * The Alight External link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
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

  /**
   * @inheritDoc
   */
  public init(): void {
    // The UI component is already registered by AlightExternalLinkPluginUI plugin
  }
}
