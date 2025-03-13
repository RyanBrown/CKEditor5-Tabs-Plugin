// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { CkAlightModalDialog, DialogButton } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { Notification } from '@ckeditor/ckeditor5-ui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
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

      button.on('execute', async () => {
        await this._showModal();
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
  public async _showModal(initialValue?: { url?: string; orgName?: string; email?: string }): Promise<void> {
    if (!this._modalDialog) {
      // Define button configuration using the DialogButton interface
      const buttons: DialogButton[] = [
        { label: t('Continue'), isPrimary: true, closeOnClick: false },
        { label: t('Cancel') }
      ];

      // Create modal with enhanced configuration
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create a New Document',
        modal: true,
        width: '80vw',
        contentClass: 'cka-new-document-content',
        buttons: buttons,
      });

      // Set up event handlers using the improved event system
      this._setupModalEventHandlers();

      // Set up form manager reference to modal for button state updates
      if (this._formManager) {
        this._formManager.setModalDialog(this._modalDialog);
      }
    } else {
      // Update existing modal if needed
      this._modalDialog.setProps({
        title: 'Create a New Document'
      });
    }

    // Set modal content using form manager
    if (this._formManager) {
      const container = document.createElement('div');
      this._formManager.renderContent(container);
      this._modalDialog.setContent(container);

      // Show the modal with animation
      this._modalDialog.show();
    }
  }

  private _setupModalEventHandlers(): void {
    if (!this._modalDialog) return;

    // Button click handler
    this._modalDialog.on('buttonClick', async (data: { button: string; }) => {
      if (this._isSubmitting) return;

      if (data.button === 'Clear') {
        this._formManager?.resetForm();
        return;
      }

      if (data.button === 'Continue' && this._formManager) {
        // Validate form before submission
        const validation = this._formManager.validateForm();
        if (validation.isValid) {
          await this._handleFormSubmission();
        } else {
          this._showValidationErrors();
        }
      }
    });

    // Modal lifecycle events
    this._modalDialog.on('show', () => {
      console.log('Document creation modal is now visible');
    });

    this._modalDialog.on('hide', () => {
      console.log('Document creation modal is now hidden');

      // Fire a custom event when modal is closed
      this.fire('modalClosed');
    });

    // Handle before hide to potentially prevent closing with unsaved changes
    this._modalDialog.on('beforeHide', () => {
      // Could implement "unsaved changes" check here if needed
      return true; // Allow closing
    });
  }

  private async _handleFormSubmission(): Promise<void> {
    if (!this._formManager || !this._modalDialog || this._isSubmitting) {
      return;
    }

    // Access buttons through modal's API
    const modalElement = this._modalDialog.getElement();
    if (!modalElement) return;

    // Get buttons
    const submitButton = modalElement.querySelector('.continue-button') as HTMLButtonElement;
    const clearButton = modalElement.querySelector('.clear-button') as HTMLButtonElement;

    try {
      this._isSubmitting = true;

      // Update UI to show submission in progress
      this._updateButtonsForSubmission(submitButton, clearButton, true);

      // Get form validation result
      const validation = this._formManager.validateForm();

      // Show validation errors if not valid
      if (!validation.isValid) {
        this._showValidationErrors();
        return;
      }

      // Log the form data before submission
      const formData = this._formManager.getFormData();
      console.log('Form data before submission:', formData);

      // Submit the form
      const result = await this._formManager.submitForm();

      // Create custom event with the result data
      const customEvent = {
        documentUrl: result.url,
        documentId: result.id,
        documentTitle: formData.documentTitle,
        formData: formData
      };

      // Dispatch document created event to the editor
      this.editor.editing.view.document.fire('newDocumentCreated', customEvent);

      // Show success notification
      const notification = this.editor.plugins.get(Notification);
      notification.showSuccess(`Document "${formData.documentTitle}" created successfully`);

      // Reset the form
      this._formManager.resetForm();

      // Close modal after a short delay
      setTimeout(() => {
        this._modalDialog?.hide();
      }, 500);

    } catch (error) {
      console.error('Form submission error:', error);

      // Show error notification with details
      const notification = this.editor.plugins.get(Notification);
      notification.showWarning(
        error instanceof Error ?
          `Error creating document: ${error.message}` :
          'An unexpected error occurred while creating the document'
      );

    } finally {
      // Reset UI state
      this._updateButtonsForSubmission(submitButton, clearButton, false);
      this._isSubmitting = false;
    }
  }

  private _updateButtonsForSubmission(submitButton: HTMLButtonElement | null, clearButton: HTMLButtonElement | null, isSubmitting: boolean): void {
    if (submitButton) {
      submitButton.disabled = isSubmitting;
      if (isSubmitting) {
        submitButton.classList.add('loading');
      } else {
        submitButton.classList.remove('loading');
      }
    }

    if (clearButton) {
      clearButton.disabled = isSubmitting;
    }
  }

  private _showValidationErrors(): void {
    if (!this._modalDialog || !this._formManager) return;

    const formContainer = this._modalDialog.getContentElement();
    if (!formContainer) return;

    // Clear any existing error messages
    formContainer.querySelectorAll('.cka-error-message').forEach(msg => {
      msg.classList.remove('visible');
    });

    // Show specific error messages
    const validation = this._formManager.validateForm();
    if (validation.errors) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        const errorElement = formContainer.querySelector(`.${field}-error`);
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.classList.add('visible');
        }
      });
    }

    // Re-enable UI elements
    this._isSubmitting = false;
    const submitButton = this._modalDialog.getElement()?.querySelector('.continue-button') as HTMLButtonElement;
    const clearButton = this._modalDialog.getElement()?.querySelector('.clear-button') as HTMLButtonElement;
    this._updateButtonsForSubmission(submitButton, clearButton, false);
  }

  public override destroy(): void {
    super.destroy();

    // Ensure proper cleanup
    if (this._modalDialog) {
      this._modalDialog.destroy();
      this._modalDialog = undefined;
    }

    if (this._formManager) {
      this._formManager.destroy();
      this._formManager = undefined;
    }
  }
}
