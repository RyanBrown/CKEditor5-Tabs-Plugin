// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin.ts
import { Plugin, Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPredefinedLinkPluginEditing from './alight-predefined-link-plugin-editing';
import AlightPredefinedLinkPluginUI from './alight-predefined-link-plugin-ui';
import { predefinedLinkRegistry } from './alight-predefined-link-plugin-registry';
import { PredefinedLinksConfig } from './alight-predefined-link-plugin-types';

export default class AlightPredefinedLinkPlugin extends Plugin {
  public static get requires() {
    return [Link, AlightPredefinedLinkPluginEditing, AlightPredefinedLinkPluginUI] as const;
  }

  public static get pluginName() {
    return 'AlightPredefinedLinkPlugin' as const;
  }

  constructor(editor: Editor) {
    super(editor);
  }

  public init(): void {
    try {
      // Register custom metadata for tracking predefined links
      const editor = this.editor;

      // Try to set up editor config to point to our registry
      try {
        // Use our singleton registry as the source of truth
        const registry = predefinedLinkRegistry.getRegistry();

        // Set up the config to point to our registry
        // This makes it accessible through the standard CKEditor config API
        const predefinedLinksConfig: PredefinedLinksConfig = { registry };

        // Try to set it in the editor config properly
        editor.config.set('predefinedLinks', predefinedLinksConfig);
      } catch (e) {
        console.warn('Could not set predefinedLinks in config', e);
      }
    } catch (e) {
      console.error('Error initializing predefined link plugin', e);
    }
  }
}