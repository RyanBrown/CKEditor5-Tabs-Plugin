// src/plugins/alight-predefined-link-plugin/ui/linkmodal-modal-types.ts
export interface PredefinedLink {
  predefinedLinksDetails: boolean;
  predefinedLinkName: string;
  predefinedLinkDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  pageCode: string;
  domain: string;
  uniqueId: string | number;
  attributeName: string;
  attributeValue: string;
}

export interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}
