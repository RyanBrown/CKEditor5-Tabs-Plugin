// src/plugins/alight-link-plugin/modal-content/ILinkManager.ts

// Minimal interface that both managers implement.
// This allows the command to work with any manager interchangeably.
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}