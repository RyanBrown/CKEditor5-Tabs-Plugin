// src/plugins/alight-link-plugin/modal-content/LinkManager.ts

/**
 * Minimal interface that both managers implement.
 * This allows the command to work with any manager interchangeably.
 */
export interface LinkManager {
  // Returns the raw HTML string for a given page of data.
  getLinkContent(page: number): string;

  // Renders the current UI (including attaching events) into the container.
  renderContent(container: HTMLElement): void;

  // Resets internal filters, pagination, etc. (if needed).
  resetSearch?(): void;

  // Returns the selected link.
  getSelectedLink(): { destination: string; title: string } | null;

  // Sets the dialog.
  setDialog?(dialog: any): void;
}
