// src/plugins/alight-population-plugin/ui/popmodal-ILinkManager.ts
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
  onLinkSelected?: ((link: any | null) => void) | null;
}
