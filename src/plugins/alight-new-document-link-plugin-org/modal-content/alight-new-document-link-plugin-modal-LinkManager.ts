// src/plugins/alight-new-document-link-plugin/modal-content/interfaces/alight-new-document-link-plugin-modal-LinkManager.ts

export interface LinkManager {
  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // Resets internal filters, pagination, etc.
  resetForm(): void;

  // Validates the form data
  validateForm(): { isValid: boolean; message?: string };

  // Gets the form data
  getFormData(): any;
}
