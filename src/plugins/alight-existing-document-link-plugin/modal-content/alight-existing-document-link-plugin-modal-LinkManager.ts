// src/plugins/alight-existing-document-link-plugin/modal-content/alight-existing-document-link-plugin-modal-LinkManager.ts

// Minimal interface that both managers implement.
// This allows the command to work with any manager interchangeably.
export interface LinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}