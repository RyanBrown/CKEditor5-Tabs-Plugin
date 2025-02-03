// src/plugins/alight-image-plugin/modal-content/types/document-types.ts

export interface DocumentItem {
  DocumentName: string;
  Population: string;
  Language: string;
  FileType: string;
}

export interface DocumentData {
  responseStatus: string;
  branchName: string;
  documentList: DocumentItem[];
}