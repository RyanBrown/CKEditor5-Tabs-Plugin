// src/plugins/alight-link-plugin/modal-content/types.ts

// Dialog and Command Types
export interface DialogButton {
  label: string;
  variant?: 'outlined' | 'default';
  className?: string;
  position?: 'left' | 'right';
  closeOnClick?: boolean;
  onClick?: () => void;
}

export interface CommandData {
  title: string;
  modalType?: 'predefinedLink' | 'publicWebsiteLink' | 'intranetLink' | 'existingDocumentLink' | 'newDocumentLink';
  modalOptions?: {
    width?: string;
    height?: string;
    contentClass?: string;
    [key: string]: any;
  };
  buttons?: DialogButton[];
  loadContent: () => Promise<string>;
  manager?: any;
}

// Document Types
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