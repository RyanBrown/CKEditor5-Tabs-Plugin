// src/plugins/alight-existing-document-link-plugin/ui/linkmodal-modal-types.ts
export interface DocumentLink {
  serverFilePath: string;
  title: string;
  fileId: string;
  fileType: string;
  population: string;
  locale: string;
  lastUpdated: number;
  updatedBy: string;
  upointLink: string;
  documentDescription: string;
  expiryDate: number;
}

export interface DocumentResponse {
  responseStatus: string;
  branchName: string;
  documentList: DocumentLink[];
}

export interface LinkSelection {
  destination: string;
  title: string;
}

export interface SelectedFilters {
  [key: string]: string[];
  fileType: string[];
  population: string[];
  locale: string[];
}