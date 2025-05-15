// src/plugins/alight-prevent-link-nesting-plugin/alight-prevent-link-nesting-config.ts
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import type { AlightPreventLinkNestingPluginConfig } from './types';

/**
 * Extended editor configuration interface that includes custom plugin configurations
 */
export interface ExtendedEditorConfig extends EditorConfig {
  alightPreventLinkNesting?: AlightPreventLinkNestingPluginConfig;
  [key: string]: any; // Allow any other properties to avoid errors with existing config
}

/**
 * Helper function to create an editor configuration with proper type checking
 * for custom plugin configurations
 * 
 * @param config The editor configuration with custom plugin configurations
 * @returns The typed editor configuration
 */
export function createEditorConfig(config: ExtendedEditorConfig): EditorConfig {
  return config;
}
