// src/plugins/alight-email-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightEmailLinkPluginEditing from './linkediting';
import AlightEmailLinkPluginUI from './linkui';
import AlightEmailAutoLink from './autolink';
import EmailLinkHandler from './emaillinkhandler'; // Import the new email handler
import './styles/alight-email-link-plugin.scss';

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
    return [
      AlightEmailLinkPluginEditing,
      AlightEmailLinkPluginUI,
      AlightEmailAutoLink,
      EmailLinkHandler // Add the email link handler
    ] as const;
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
