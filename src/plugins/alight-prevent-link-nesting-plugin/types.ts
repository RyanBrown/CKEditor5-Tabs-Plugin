// src/plugins/alight-prevent-link-nesting-plugin/types.ts
import type { EditorConfig } from '@ckeditor/ckeditor5-core';

// Define the configuration for the prevent link nesting plugin
export interface AlightPreventLinkNestingPluginConfig {
  /**
   * Array of attribute names that represent link properties
   */
  linkAttributes?: string[];

  /**
   * Whether to automatically merge overlapping links (defaults to true)
   */
  mergeOverlappingLinks?: boolean;

  /**
   * Whether to show a warning modal when a user tries to nest links (defaults to true)
   */
  showWarningModal?: boolean;

  /**
   * Custom message to display in the warning modal
   */
  warningMessage?: string;
}

// Extend the EditorConfig interface from CKEditor
declare module '@ckeditor/ckeditor5-core' {
  interface EditorConfig {
    /**
     * Configuration for the AlightPreventLinkNestingPlugin
     */
    alightPreventLinkNesting?: AlightPreventLinkNestingPluginConfig;
  }
}
