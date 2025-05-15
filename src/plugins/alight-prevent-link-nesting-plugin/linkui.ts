// src/plugins/alight-prevent-link-nesting-plugin/linkui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { CkAlightModalDialog, DialogButton } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import AlightPreventLinkNestingEditing from './linkediting';

/**
 * The prevent link nesting UI feature.
 *
 * This plugin handles all UI-related logic:
 * - Warning dialog display
 * - User interaction with warnings
 */
export default class AlightPreventLinkNestingUI extends Plugin {
  /**
   * Warning message for modal
   */
  private _warningMessage: string = 'Links cannot be nested inside existing links.';

  /**
   * Whether to show the warning modal
   */
  private _showWarningModal: boolean = true;

  /**
   * Active modal instance
   */
  private _activeModal: CkAlightModalDialog | null = null;

  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPreventLinkNestingUI';
  }

  /**
   * @inheritDoc
   */
  static get requires() {
    return [AlightPreventLinkNestingEditing];
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;
    const config = editor.config.get('preventLinkNesting');

    // Set warning modal option
    if (config?.showWarningModal !== undefined) {
      this._showWarningModal = config.showWarningModal;
    }

    // Set warning message
    if (config?.warningMessage) {
      this._warningMessage = config.warningMessage;
    }

    // Listen for nesting detection from the editing feature
    this.listenTo(
      editor.plugins.get(AlightPreventLinkNestingEditing),
      'linkNestingDetected',
      () => this._showNestedLinkWarningDialog()
    );
  }

  /**
   * Shows a warning dialog when a link nesting is attempted
   */
  _showNestedLinkWarningDialog(): void {
    if (!this._showWarningModal) {
      return;
    }

    // Close any existing modal
    if (this._activeModal) {
      this._activeModal.destroy();
      this._activeModal = null;
    }

    // Create a new warning modal with correctly typed options
    const modalButtons: DialogButton[] = [
      {
        label: 'OK',
        variant: 'default' as 'default' | 'outlined' | 'text',
        isPrimary: true,
        closeOnClick: true
      }
    ];

    // Create a new warning modal
    const modalOptions = {
      title: 'Warning',
      modal: true,
      draggable: true,
      resizable: false,
      width: '400px',
      styleClass: 'ck-link-nesting-warning-modal',
      headerClass: 'ck-link-nesting-warning-header',
      contentClass: 'ck-link-nesting-warning-content',
      footerClass: 'ck-link-nesting-warning-footer',
      position: 'center' as 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      closeOnEscape: true,
      dismissableMask: true,
      showHeader: true,
      buttons: modalButtons
    };

    // Create the modal dialog
    this._activeModal = new CkAlightModalDialog(modalOptions);

    // Set the content
    const content = `
            <div class="ck-link-nesting-warning-icon">
                <i class="fa-regular fa-triangle-exclamation"></i>
            </div>
            <div class="ck-link-nesting-warning-message">
                ${this._warningMessage}
            </div>
        `;
    this._activeModal.setContent(content);

    // Show the modal
    this._activeModal.show();

    // Add an event listener to destroy the modal when closed
    this._activeModal.on('hide', () => {
      if (this._activeModal) {
        setTimeout(() => {
          this._activeModal?.destroy();
          this._activeModal = null;
        }, 300);
      }
    });
  }
}
