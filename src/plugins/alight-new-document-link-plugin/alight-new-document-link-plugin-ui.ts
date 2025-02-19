// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { EventInfo } from '@ckeditor/ckeditor5-utils';
import { Notification } from '@ckeditor/ckeditor5-ui';
import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-new-document-link-plugin.scss';

export default class AlightNewDocumentLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _formManager?: ContentManager;
  private _isSubmitting: boolean = false;

  public static get pluginName() {
    return 'AlightNewDocumentLinkPluginUI' as const;
  }

  public static get requires() {
    return [Notification] as const;
  }

  public init(): void {
    this._setupToolbarButton();
    this._initializeFormManager();
  }

  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightNewDocumentLinkPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('New Document'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      button.isEnabled = true;

      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  private _initializeFormManager(): void {
    this._formManager = new ContentManager();
  }

  private _showModal(): void {
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create a New Document',
        modal: true,
        contentClass: 'new-document-content',
        buttons: [
          {
            label: 'Clear',
            variant: 'outlined',
            position: 'left',
            shape: 'round',
            disabled: false
          },
          {
            label: 'Submit',
            variant: 'default',
            position: 'right',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,
            disabled: true // Initially disabled until form is valid
          }
        ]
      });

      this._modalDialog.on('buttonClick', async (label: string) => {
        if (this._isSubmitting) return; // Prevent multiple submissions

        if (label === 'Clear') {
          this._formManager?.resetSearch();
          return;
        }

        if (label === 'Submit') {
          await this._handleFormSubmission();
        }
      });

      // Handle modal close
      this._modalDialog.on('close', () => {
        if (this._isSubmitting) {
          // Prevent closing during submission
          return false;
        }
        // Reset form state when modal is closed
        this._formManager?.resetSearch();
        return true;
      });
    }

    // Set modal content using form manager
    if (this._formManager) {
      const container = document.createElement('div');
      this._formManager.renderContent(container);
      this._modalDialog.setContent(container);
      this._modalDialog.show();
    }
  }

  private async _handleFormSubmission(): Promise<void> {
    if (!this._formManager || !this._modalDialog || this._isSubmitting) {
      return;
    }

    const submitButton = this._modalDialog.element?.querySelector('.cka-button-primary');
    const clearButton = this._modalDialog.element?.querySelector('.cka-button-outlined');

    try {
      this._isSubmitting = true;

      // Disable buttons during submission
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
      }
      if (clearButton instanceof HTMLButtonElement) {
        clearButton.disabled = true;
      }

      const result = await this._formManager.submitForm();

      // Fire success event
      const eventInfo = new EventInfo(this, 'newDocumentFormSubmit');
      this.editor.editing.view.document.fire(eventInfo, { formData: result });

      // Show success feedback
      this._showNotification('success', 'Document uploaded successfully');

      // Close modal
      this._modalDialog.hide();

    } catch (error) {
      // Show error notification
      this._showNotification('error', error instanceof Error ? error.message : 'An unexpected error occurred');

      // Re-enable form submission if there's an error
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }

    } finally {
      this._isSubmitting = false;

      // Re-enable buttons
      if (submitButton) {
        submitButton.classList.remove('loading');
      }
      if (clearButton instanceof HTMLButtonElement) {
        clearButton.disabled = false;
      }
    }
  }

  private _showNotification(type: 'success' | 'error', message: string): void {
    const notification = this.editor.plugins.get(Notification);

    if (type === 'success') {
      notification.showSuccess(message);
    } else {
      notification.showWarning(message);
    }
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
    this._formManager?.destroy();
  }
}