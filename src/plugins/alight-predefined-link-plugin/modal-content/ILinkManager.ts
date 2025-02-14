// src/plugins/alight-link-plugin/modal-content/ILinkManager.ts
import { CKAlightModalDialog } from "../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component";

/**
 * Minimal interface that both managers implement.
 * This allows the command to work with any manager interchangeably.
 */
export interface ILinkManager {
  // Returns the currently selected link or null if none selected
  getSelectedLink(): { destination: string; title: string } | null;
  // Sets the modal dialog reference
  setDialog(dialog: CKAlightModalDialog): void;
  // Renders content into the provided container
  renderContent(container: HTMLElement): void;
  // Resets search and filter state
  resetSearch(): void;
}
