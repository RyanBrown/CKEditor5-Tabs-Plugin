// src/plugins/alight-new-document-link-plugin/modal-content/interfaces/alight-new-document-link-plugin-modal-LinkManager.ts

export interface LinkManager {
  // Returns the raw HTML string for a given page of data.
  getLinkContent(page: number): string;

  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // Resets internal filters, pagination, etc.
  resetSearch(): void;

  // Returns the selected link.
  getSelectedLink(): { destination: string; title: string } | null;

  // Validates the form data
  validateForm(): { isValid: boolean; message?: string };

  // Gets the form data
  getFormData(): any;
}