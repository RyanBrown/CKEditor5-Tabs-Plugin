// src/plugins/alight-existing-document-link/ui/linkmodal-modal-types.ts
export interface ExistingDocumentLink {
  existingDocumentLinkName: string;
  existingDocumentLinkDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  pageCode: string;
  domain: string;
  uniqueId: string | number;
  attributeName: string;
  attributeValue: string;
  title: string;
  population: string;
  locale: string;
  fileType: string;
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


export interface ExistingDocSelectedFilters {
  [key: string]: string[];
  fileType: string[];
  population: string[];
  locale: string[];
}