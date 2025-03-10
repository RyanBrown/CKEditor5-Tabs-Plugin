// src/plugins/alight-predefined-link/ui/linkmodal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}
