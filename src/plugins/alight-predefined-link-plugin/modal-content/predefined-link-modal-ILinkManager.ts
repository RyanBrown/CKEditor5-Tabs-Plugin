// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): {
    destination: string;
    title: string;
    description?: string;
    id?: string;
  } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
  getContent(): HTMLElement;
}
