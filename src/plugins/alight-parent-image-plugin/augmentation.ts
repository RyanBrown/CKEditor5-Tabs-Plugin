// src/plugins/alight-parent-link-plugin/augmentation.ts
/**
 * This file extends TypeScript interface for EditorConfig to include our custom configuration.
 */
import type { LinkPluginConfig } from './alight-parent-image-plugin';

// Augment the EditorConfig interface from CKEditor
declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    /**
     * The configuration of the AlightParentImagePlugin.
     */
    alightParentImagePlugin?: {
      /**
       * Array of link plugin configurations.
       */
      linkPlugins?: LinkPluginConfig[];
    };
  }
}
