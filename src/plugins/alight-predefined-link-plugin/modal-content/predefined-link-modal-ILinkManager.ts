// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
  getContent(): HTMLElement; // Add the getContent method to the interface
}
