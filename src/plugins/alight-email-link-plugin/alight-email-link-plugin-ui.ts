// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import './styles/alight-email-link-plugin.scss';
import { getSelectedLinkElement, isValidEmail } from './alight-email-link-plugin-utils';
import { ModalPluginInterface } from '../interfaces/custom-plugin-interfaces';

/**
 * Plugin handling the UI components for email links.
 * Sets up toolbar button and modal dialog.
 */
export default class AlightEmailLinkPluginUI extends Plugin implements ModalPluginInterface {
  private _modalDialog?: CkAlightModalDialog;
  private _balloon!: ContextualBalloon;
  private _editingPlugin!: AlightEmailLinkPluginEditing;

  // Required plugins that must be loaded for this plugin to work correctly.
  public static get requires() {
    return [LinkUI, AlightEmailLinkPluginEditing] as const;
  }

  // The unique plugin name for registration with CKEditor.
  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  /**
   * Plugin initialization.
   * Sets up toolbar button, balloon, and link UI integration.
   */
  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Get the editing plugin
    this._editingPlugin = editor.plugins.get('AlightEmailLinkPluginEditing') as AlightEmailLinkPluginEditing;

    // Add click observer to the editing view
    editor.editing.view.addObserver(ClickObserver);

    // Setup the toolbar button
    this._setupToolbarButton();
    // Setup the balloon behavior
    this._setupBalloonBehavior();
    // Override the Link UI behavior to support email links
    this._overrideLinkUIBehavior();
  }

  // Sets up the toolbar button for email links.
  private _setupToolbarButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const linkCommand = editor.commands.get('link');

      if (!linkCommand) {
        console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
        return button;
      }

      button.set({
        label: editor.t('Email Link'),
        icon: ToolBarIcon,
        tooltip: true,
        withText: true
      });

      button.bind('isEnabled').to(linkCommand);
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      button.on('execute', async () => {
        await this._showModal();
      });

      return button;
    });
  }

  // Sets up the balloon behavior for link editing.
  private _setupBalloonBehavior(): void {
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });
  }

  // Overrides the Link UI behavior to support email links.
  private _overrideLinkUIBehavior(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');

    if (linkUI) {
      // Override the showActions method to extend the default actions view
      const originalShowActions = linkUI.showActions?.bind(linkUI);
      if (originalShowActions) {
        linkUI.showActions = (...args: any[]) => {
          originalShowActions(...args);
          this._extendDefaultActionsView();
        };
      }

      // Override the link preview display
      this._overrideLinkPreviewDisplay(linkUI);
    }
  }

  /**
   * Overrides the link preview display to better handle email links.
   * 
   * @param linkUI The Link UI plugin instance
   */
  private _overrideLinkPreviewDisplay(linkUI: any): void {
    const editor = this.editor;
    const originalCreateActionsView = linkUI._createActionsView?.bind(linkUI);

    if (originalCreateActionsView) {
      linkUI._createActionsView = () => {
        const actionsView = originalCreateActionsView();

        // Unbind the default label and tooltip
        actionsView.previewButtonView.unbind('label');
        actionsView.previewButtonView.unbind('tooltip');

        // Bind the label to display cleaned email address (without mailto:)
        actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
          if (!href) {
            return editor.t('This link has no URL');
          }
          return href.toLowerCase().startsWith('mailto:') ? href.substring(7) : href;
        });

        // Bind the tooltip to show appropriate action for email links
        actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
          if (href && href.toLowerCase().startsWith('mailto:')) {
            return editor.t('Open email in client');
          }
          return editor.t('Open link in new tab');
        });

        return actionsView;
      };
    }
  }

  // Handles the removal of an email link.
  private _handleLinkRemoval(): void {
    // Use the editing plugin's method instead of duplicating logic
    this._editingPlugin.removeEmailLink();
  }

  // Extends the default actions view to handle email links.
  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');
    if (!linkUI || !linkUI.actionsView) {
      return;
    }

    const actionsView: any = linkUI.actionsView;
    const linkCommand = editor.commands.get('link');

    if (!linkCommand || typeof linkCommand.value !== 'string') {
      return;
    }

    let linkValue = linkCommand.value.trim().toLowerCase();

    // Only modify behavior for mailto: links
    if (!linkValue.startsWith('mailto:')) {
      if (actionsView.editButtonView) {
        actionsView.editButtonView.off('execute');
        actionsView.off('edit');
      }
      return;
    }

    // Handle the edit button for mailto: links
    if (actionsView.editButtonView) {
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        // Get the selected link element
        const selectedLinkElement = getSelectedLinkElement(editor);

        if (!selectedLinkElement) {
          console.warn('[AlightEmailLinkPluginUI] No link element found for editing.');
          return;
        }

        // Get the email from the href attribute (without mailto: prefix)
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        // Extract organization name from the link text
        const { orgName: extractedOrgName } =
          this._editingPlugin.getLinkData(selectedLinkElement);

        console.log('DEBUG: Opening modal with data:', { email, orgName: extractedOrgName });

        // Show modal with the cleaned email and extracted org name
        this._showModal({ email, orgName: extractedOrgName });
      }, { priority: 'highest' });

      // Prevent the default link UI from taking over
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      });
    }

    // Handle the unlink button
    if (actionsView.unlinkButtonView) {
      actionsView.unlinkButtonView.off('execute');
      actionsView.unlinkButtonView.on('execute', () => {
        this._handleLinkRemoval();
      }, { priority: 'highest' });
    }
  }

  /**
  * Shows the modal dialog for creating or editing an email link.
  * Made public so it can be called from the parent link plugin.
  * 
  * @param initialValue Optional initial values for email and organization name
  */
  public async _showModal(initialValue?: { email?: string; orgName?: string; url?: string }): Promise<void> {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');

    // Handle case where url is provided instead of email (from parent plugin)
    let emailValue = initialValue?.email || '';
    let orgNameValue = initialValue?.orgName || '';

    // If url is provided but not email, extract email from mailto: url
    if (initialValue?.url && !emailValue && typeof initialValue.url === 'string') {
      const url = initialValue.url;
      if (url.toLowerCase().startsWith('mailto:')) {
        emailValue = url.substring(7); // Remove mailto: prefix
      }
    }

    if (!linkCommand) {
      console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create an Email Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'cka-email-link-content',
        buttons: [
          { label: 'Cancel', disabled: false },
          { label: 'Continue', isPrimary: true, closeOnClick: false, disabled: false }
        ]
      });

      this._modalDialog.on('buttonClick', async (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const emailInput = form.querySelector('#email') as HTMLInputElement;
          const orgNameInput = form.querySelector('#org-name') as HTMLInputElement;
          const emailVal = emailInput.value.trim();
          const orgNameVal = orgNameInput.value.trim();

          if (this._validateEmail(emailVal)) {
            // Use the command to apply the email link
            editor.execute('applyEmailLinkPlugin', {
              email: emailVal,
              orgName: orgNameVal || undefined
            });

            this._modalDialog?.hide();
          }
        }
      });
    }

    // Create an empty container for the modal content
    const container = document.createElement('div');
    container.className = 'email-link-modal-content';

    // Set the empty container as content
    this._modalDialog.setContent(container);

    // Show the modal first
    this._modalDialog.show();

    // Now use the editor's downcast conversion to create the form
    this._renderFormFromModel(container, emailValue, orgNameValue);
  }

  /**
   * Renders the email form in the modal using the model-based approach.
   * 
   * @param containerElement The container element to render the form into
   * @param initialEmail Initial email value (without mailto: prefix)
   * @param initialOrgName Initial organization name value
   */
  private _renderFormFromModel(containerElement: HTMLElement, initialEmail: string = '', initialOrgName: string = ''): void {
    const editor = this.editor;

    try {
      editor.model.change(writer => {
        // Create the form structure using the editing component
        const formModel = this._editingPlugin.createEmailFormModel(writer, initialEmail, initialOrgName);

        // Convert the model to view
        const viewFragment = editor.data.toView(formModel);

        // Convert the view to DOM
        const domFragment = editor.data.processor.toData(viewFragment);

        // Insert the DOM fragment into the container
        containerElement.innerHTML = domFragment;

        // Ensure the values are set in the actual DOM inputs
        setTimeout(() => {
          const emailInput = containerElement.querySelector('#email') as HTMLInputElement;
          const orgNameInput = containerElement.querySelector('#org-name') as HTMLInputElement;

          if (emailInput && initialEmail) {
            // Ensure mailto: prefix is removed
            emailInput.value = initialEmail.replace(/^mailto:/i, '');
          }

          if (orgNameInput && initialOrgName) {
            orgNameInput.value = initialOrgName;
          }
        }, 0);
      });
    } catch (error) {
      console.error('Error creating email form from model:', error);

      // Display a user-friendly error message
      containerElement.innerHTML = '<div class="email-form-error">Unable to load the email form. Please try again later.</div>';

      // Disable the Continue button
      const continueButton = this._modalDialog?.element?.querySelector('button[data-button="Continue"]');
      if (continueButton) {
        continueButton.setAttribute('disabled', 'disabled');
      }
    }
  }

  /**
   * Validates an email input with appropriate error handling.
   * 
   * @param email The email value to validate
   * @returns True if the email is valid, false otherwise
   */
  private _validateEmail(email: string): boolean {
    const emailInput = this._modalDialog?.element?.querySelector('#email') as HTMLInputElement;
    const emailError = this._modalDialog?.element?.querySelector('#email-error') as HTMLDivElement;

    this._hideError(emailInput, emailError);

    if (!email) {
      this._showError(emailInput, emailError, 'Email address is required.');
      return false;
    }

    // Remove mailto: prefix for validation if present
    const cleanEmail = email.replace(/^mailto:/i, '').trim();

    if (!isValidEmail(cleanEmail)) {
      this._showError(emailInput, emailError, 'Please enter a valid email address.');
      return false;
    }

    return true;
  }

  /**
   * Shows an error message for a form input.
   * 
   * @param input The input element
   * @param errorElement The error message element
   * @param message The error message text
   */
  private _showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
    input.classList.add('invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  /**
   * Hides the error message for a form input.
   * 
   * @param input The input element
   * @param errorElement The error message element
   */
  private _hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
    input.classList.remove('invalid');
    errorElement.style.display = 'none';
  }

  // Clean up resources when the plugin is destroyed.
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}