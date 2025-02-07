export interface DialogButton {
  label: string;
  className: string;
  variant?: 'text' | 'outlined' | 'default';
  position?: string;
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