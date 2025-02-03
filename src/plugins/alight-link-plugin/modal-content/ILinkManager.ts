// src/plugins/alight-link-plugin/modal-content/ILinkManager.ts

/**
 * Minimal interface that both managers implement.
 * This allows the command to work with any manager interchangeably.
 */
export interface ILinkManager {
  // Returns the raw HTML string for a given page of data.
  getLinkContent(page: number): string;

  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // Resets internal filters, pagination, etc. (if needed).
  resetSearch(): void;
}
