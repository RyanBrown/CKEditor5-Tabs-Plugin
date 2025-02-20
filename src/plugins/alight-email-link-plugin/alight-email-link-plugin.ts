// src/plugins/alight-email-link-plugin/alight-email-link-plugin.ts

// Import necessary classes and plugins from CKEditor5.
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import AlightEmailLinkPluginUI from './alight-email-link-plugin-plugin-ui';

// The main plugin class that integrates the email link functionality.
// It bundles together the editing and UI components along with the core Link plugin.
export default class AlightEmailLinkPlugin extends Plugin {
  // Specifies the plugins that this plugin requires.
  // This includes the editing part, UI part, and the core Link plugin.
  public static get requires() {
    console.log('[AlightEmailLinkPlugin] Retrieving required plugins.');
    return [AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI, Link] as const;
  }

  // Returns the plugin name.
  public static get pluginName() {
    console.log('[AlightEmailLinkPlugin] Retrieving plugin name.');
    return 'AlightEmailLinkPlugin' as const;
  }
}
