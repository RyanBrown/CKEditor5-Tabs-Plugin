// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';

// We import LinkUI so that its balloon/commands are available.
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-email-link-plugin.scss';

/**
 * A UI plugin that provides a "Email Link" toolbar button.
 * When clicked, it opens a modal dialog, and on submit, calls
 * the built-in `link` command with a mailto: href string.
 */
export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;

  public static get requires() {
    // Ensure that LinkUI is loaded so we can use the built-in link command.
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    // Add the click observer so default LinkUI link clicks are handled (optional).
    this.editor.editing.view.addObserver(ClickObserver);

    // Create the toolbar button for "Email Link".
    this._setupToolbarButton();
  }

  /**
   * Creates a toolbar button named "alightEmailLinkPlugin".
   * The built-in 'link' command is used to insert or edit the mailto link.
   */
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);

      // The built-in Link plugin registers a command named 'link'.
      const linkCommand = editor.commands.get('link');
      if (!linkCommand) {
        console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
        return button;
      }

      button.set({
        label: t('Email Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true
      });

      // Enable or disable the button based on the built-in link command state.
      button.bind('isEnabled').to(linkCommand);

      // Highlight the button (toggle) when a link is selected in the editor.
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // On execute, open our custom modal to get the email address.
      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  /**
   * Opens a custom modal dialog. On "Continue", the user’s email is retrieved
   * and `editor.execute('link', 'mailto:' + email)` is called.
   */
  private _showModal(initialValue?: { email: string; orgName?: string }): void {
    const editor = this.editor;

    // The built-in "link" command is used to set linkHref in the model.
    const linkCommand = editor.commands.get('link');
    if (!linkCommand) {
      console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialEmail = initialValue?.email || '';
    const initialOrgName = initialValue?.orgName || '';

    if (!this._modalDialog) {
      // Create the dialog once.
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create an Email Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'email-link-content',
        buttons: [
          {
            label: 'Cancel',
            variant: 'outlined',
            shape: 'round',
            disabled: false
          },
          {
            label: 'Continue',
            variant: 'default',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,
            disabled: false
          }
        ]
      });

      // Handle button clicks.
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          // Validate the email form input.
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const isValid = validateForm(form);
          if (isValid) {
            const emailInput = form.querySelector('#link-email') as HTMLInputElement;
            // Optional: Org name, if you want to do something with it.
            // const orgNameInput = form.querySelector('#org-name') as HTMLInputElement;

            const emailVal = emailInput.value.trim();

            // Run the link command with a mailto: string. This sets linkHref in the model.
            editor.model.change(() => {
              editor.execute('link', 'mailto:' + emailVal);
            });

            this._modalDialog?.hide();
          }
        }
      });
    }

    // Generate the form content with default values.
    const content = ContentManager(initialEmail, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  /**
   * Clean up resources.
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}
