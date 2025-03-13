// src/plugins/alight-existing-document-link/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExistingDocumentLinkPluginEditing from './linkediting';
import AlightExistingDocumentLinkPluginUI from './linkui';
import AlightExistingDocumentLinkPluginAutoLink from './autolink';
import './styles/alight-existing-document-link-plugin.scss';

/**
 * The Alight Existing Document link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightExistingDocumentLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExistingDocumentLinkPluginEditing, AlightExistingDocumentLinkPluginUI, AlightExistingDocumentLinkPluginAutoLink] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExistingDocumentLinkPlugin' as const;
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
    // The UI component is already registered by AlightExistingDocumentLinkPluginUI plugin
  }
}
