// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _emailLinkCommand!: AlightEmailLinkPluginCommand;

  public static get requires() {
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Add click observer
    editor.editing.view.addObserver(ClickObserver);

    // Get the command
    this._emailLinkCommand = editor.commands.get('alightEmailLink') as AlightEmailLinkPluginCommand;

    // Set up the toolbar button
    this._setupToolbarButton();
  }

  private _setupToolbarButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: editor.t('Email Link'),
        icon: ToolBarIcon,
        tooltip: true,
        withText: true
      });
      // Bind button state to command state
      button.bind('isEnabled').to(this._emailLinkCommand, 'isEnabled');

      // Execute button
      button.on('execute', () => {
        const selection = editor.model.document.selection;
        const range = selection.getFirstRange();

        if (range && !range.isCollapsed) {
          this._showModal();
        } else if (range && range.isCollapsed) {
          // If no text is selected but cursor is placed
          this._showModal();
        }
      });

      return button;
    });
  }

  private _showModal(initialData?: { email?: string; orgName?: string }): void {
    const editor = this.editor;

    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create an Email Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'email-link-content',
        buttons: [
          { label: 'Cancel', variant: 'outlined', shape: 'round' },
          { label: 'Continue', variant: 'default', isPrimary: true, shape: 'round', closeOnClick: false }
        ]
      });

      const formHtml = `
        <form id="email-link-form" class="ck-form">
          <div class="ck-form-group">
            <label class="cka-input-label" for="email">Email Address</label>
            <input type="email" id="email" class="cka-input-text block" required />
            <div class="error-message" style="display: none; color: red; margin-top: 4px;"></div>
          </div>
          <div class="ck-form-group mt-3">
            <label class="cka-input-label" for="orgName">Organization Name (optional)</label>
            <input type="text" id="orgName" class="cka-input-text block" />
          </div>
          <p class="note-text mt-3">
            Specify the third-party organization to inform users about the email's origin.
          </p>
        </form>
      `;

      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = document.getElementById('email-link-form') as HTMLFormElement;
          const emailInput = form?.querySelector('#email') as HTMLInputElement;
          const orgNameInput = form?.querySelector('#orgName') as HTMLInputElement;
          const errorDiv = form?.querySelector('.error-message') as HTMLDivElement;

          const email = emailInput?.value.trim();
          const orgName = orgNameInput?.value.trim();

          if (!email) {
            errorDiv.textContent = 'Email address is required.';
            errorDiv.style.display = 'block';
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errorDiv.textContent = 'Please enter a valid email address.';
            errorDiv.style.display = 'block';
            return;
          }

          editor.execute('alightEmailLink', {
            email,
            orgNameText: orgName
          });

          this._modalDialog?.hide();
        }
      });

      this._modalDialog.setContent(formHtml);
    }

    // Reset form and set initial values if provided
    const form = document.getElementById('email-link-form');
    if (form) {
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const orgNameInput = form.querySelector('#orgName') as HTMLInputElement;
      const errorDiv = form.querySelector('.error-message') as HTMLDivElement;

      // Clear previous values
      emailInput.value = '';
      orgNameInput.value = '';
      errorDiv.style.display = 'none';

      // Set initial values if provided
      if (initialData?.email) {
        emailInput.value = initialData.email;
      }
      if (initialData?.orgName) {
        orgNameInput.value = initialData.orgName;
      }
    }

    this._modalDialog.show();

    // Focus email input after showing
    setTimeout(() => {
      const emailInput = document.querySelector('#email') as HTMLInputElement;
      emailInput?.focus();
    }, 100);
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}