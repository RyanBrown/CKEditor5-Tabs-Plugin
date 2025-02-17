// src/plugins/alight-link-plugin/modal-content/ILinkManager.ts
import { CkAlightModalDialog } from "../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component";

/**
 * Minimal interface that both managers implement.
 * This allows the command to work with any manager interchangeably.
 */
export interface ILinkManager {
  getSelectedLink(): { destination: string; title: string } | null;
  renderContent(container: HTMLElement): void;
  resetSearch(): void;
}