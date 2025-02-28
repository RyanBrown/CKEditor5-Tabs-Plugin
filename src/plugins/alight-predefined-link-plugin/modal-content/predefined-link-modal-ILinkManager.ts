// src/plugins/alight-balloon-link-plugin/modal-content/balloon-link-modal-LinkManager.ts

// Minimal interface that both managers implement.
// This allows the command to work with any manager interchangeably.
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
  getContent(): HTMLElement; // Add the getContent method to the interface
}