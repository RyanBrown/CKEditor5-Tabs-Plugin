// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types.ts
export interface PredefinedLink {
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

export interface DocumentLink {
  documentId: string;
  documentName: string;
  documentDescription: string;
  documentType: string;
  documentUrl: string;
}

export interface DocumentResponse {
  responseStatus: string;
  branchName: string;
  documentList: DocumentLink[];
}

export interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}
