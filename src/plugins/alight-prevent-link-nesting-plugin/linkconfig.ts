// src/plugins/alight-prevent-link-nesting-plugin/linkconfig.ts
import type { EditorConfig } from '@ckeditor/ckeditor5-core';

/**
 * Configuration options for the AlightPreventLinkNesting plugin
 */
export interface AlightPreventLinkNestingConfig {
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
     * Configuration for the AlightPreventLinkNesting plugin
     */
    preventLinkNesting?: AlightPreventLinkNestingConfig;
  }
}

export default AlightPreventLinkNestingConfig;
