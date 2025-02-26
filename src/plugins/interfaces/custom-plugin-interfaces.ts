// src/plugins/interfaces/custom-plugin-interfaces.ts
import { PluginInterface } from '@ckeditor/ckeditor5-core/src/plugin';

/**
 * Interface for plugins that provide modal dialogs
 */
export interface ModalPluginInterface extends PluginInterface {
  /**
   * Shows a modal dialog
   * @param initialValue Optional initial values for the modal
   */
  _showModal(initialValue?: { url?: string; orgName?: string; email?: string }): void;
}