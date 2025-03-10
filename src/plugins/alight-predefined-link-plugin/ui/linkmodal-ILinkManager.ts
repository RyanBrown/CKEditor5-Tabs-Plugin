// src/plugins/alight-predefined-link-plugin/ui/linkmodal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}
