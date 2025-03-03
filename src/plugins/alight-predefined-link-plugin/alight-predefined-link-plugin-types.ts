// ssrc/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-types.ts
export interface PredefinedLinkData {
  id: string;
  name: string;
  description: string;
  url: string;
  pageCode?: string;
  domain?: string;
  baseOrClientSpecific?: string;
  pageType?: string;
}

// A registry to track which URLs are predefined links and their metadata
export type PredefinedLinkRegistry = Map<string, PredefinedLinkData>;

// Interface for editor config extension
export interface PredefinedLinksConfig {
  registry: PredefinedLinkRegistry;
}

// Augment CKEditor's Config type
declare module '@ckeditor/ckeditor5-core/src/editor/editorconfig' {
  interface EditorConfig {
    predefinedLinks?: PredefinedLinksConfig;
  }
}