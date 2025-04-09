// src/plugins/alight-existing-document-link/ui/linkmodal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}
