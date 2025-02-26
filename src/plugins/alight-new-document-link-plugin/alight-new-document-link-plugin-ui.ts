// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { Notification } from '@ckeditor/ckeditor5-ui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import './styles/alight-new-document-link-plugin.scss';
import { ModalPluginInterface } from './../interfaces/custom-plugin-interfaces';

export default class AlightNewDocumentLinkPluginUI extends Plugin implements ModalPluginInterface {
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
      const command = editor.commands.get('alightNewDocumentLinkPlugin');

      button.set({
        label: t('New Document'),
        icon: ToolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Bind button state to command if available
      if (command) {
        button.bind('isEnabled').to(command);
      } else {
        button.isEnabled = true;
      }

      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  private _initializeFormManager(): void {
    this._formManager = new ContentManager();
  }

  /**
   * Shows the modal dialog for creating a new document.
   * Made public so it can be called from the parent link plugin.
   * 
   * @param initialValue Optional initial values (not used in this plugin, but included for API consistency)
   */
  public _showModal(initialValue?: { url?: string; orgName?: string; email?: string }): void {
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create a New Document',
        modal: true,
        contentClass: 'new-document-content',
        buttons: [
          {
            label: 'Clear',
            variant: 'outlined',
            shape: 'round',
          },
          {
            label: 'Submit',
            variant: 'default',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,  // Keep this false to handle closing manually
            disabled: true // Initially disabled until form is valid
          }
        ]
      });

      // Properly connect button clicks to form submission
      this._modalDialog.on('buttonClick', async (label: string) => {
        if (this._isSubmitting) return;

        if (label === 'Clear') {
          this._formManager?.resetForm();
          return;
        }

        if (label === 'Submit' && this._formManager) {
          // Validate form before submission
          const validation = this._formManager.validateForm();
          if (validation.isValid) {
            await this._handleFormSubmission();
          }
        }
      });

      // Set up form manager reference to modal for button state updates
      if (this._formManager) {
        this._formManager.setModalDialog(this._modalDialog);
      }
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

      // Get form validation result
      const validation = this._formManager.validateForm();

      // Log the form data before submission
      console.log('Form data before submission:', this._formManager.getFormData());

      if (!validation.isValid) {
        // Show field-level error messages
        const formContainer = this._modalDialog.element?.querySelector('.new-document-content');
        if (formContainer) {
          // Clear any existing error messages
          formContainer.querySelectorAll('.cka-error-message').forEach(msg => {
            msg.classList.remove('visible');
          });

          // Show specific error messages
          Object.entries(validation.errors || {}).forEach(([field, message]) => {
            const errorElement = formContainer.querySelector(`.${field}-error`);
            if (errorElement) {
              errorElement.textContent = message;
              errorElement.classList.add('visible');
            }
          });
        }
        return;
      }

      const result = await this._formManager.submitForm();

      // Log the submission result
      console.log('Form submission result:', result);

      // Show success feedback using the notification system
      const notification = this.editor.plugins.get(Notification);
      notification.showSuccess('Document uploaded successfully');

      // Reset the form
      this._formManager.resetForm();

      // Close modal after a short delay to ensure reset is complete
      setTimeout(() => {
        this._modalDialog?.hide();
      }, 100);

    } catch (error) {
      // Log any errors
      console.error('Form submission error:', error);

      // Show error using the notification system
      const notification = this.editor.plugins.get(Notification);
      notification.showWarning(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );

    } finally {
      this._isSubmitting = false;

      // Re-enable buttons
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
      }
      if (clearButton instanceof HTMLButtonElement) {
        clearButton.disabled = false;
      }
    }
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
    this._formManager?.destroy();
  }
}