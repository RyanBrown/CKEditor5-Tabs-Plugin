// src/plugins/alight-existing-document-link-plugin/modal-content/alight-existing-document-link-plugin-modal-types.ts
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
  expiryDate: string;
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
