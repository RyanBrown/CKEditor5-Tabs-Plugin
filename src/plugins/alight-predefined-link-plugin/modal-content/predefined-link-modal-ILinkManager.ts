// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-ILinkManager.ts

// Minimal interface that both managers implement.
// This allows the command to work with any manager interchangeably.
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}