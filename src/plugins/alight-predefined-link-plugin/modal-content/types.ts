// src/plugins/alight-predefined-link-plugin/modal-content/types.ts
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

export interface DialogOptions {
  title?: string;
  width?: string;
  height?: string;
  buttons?: DialogButton[];
}

export interface DialogButton {
  label: string;
  variant?: 'default' | 'outlined' | 'text';
  position?: 'left' | 'right';
  closeOnClick?: boolean;
  disabled?: boolean;
  isPrimary?: boolean;
  shape?: 'round' | 'default';
}
