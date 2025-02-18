// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types.ts
export interface PredefinedLink {
  predefinedLinkName: string;
  predefinedLinkDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  domain: string;
  uniqueId: string;
  attributeName: string;
  attributeValue: string;
}

export interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}
