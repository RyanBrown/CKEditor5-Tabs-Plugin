// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';

// Import the built-in LinkUI plugin so its balloon & commands are available.
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-email-link-plugin.scss';

/**
 * A UI plugin that provides:
 * 1. A "Email Link" toolbar button that calls the built-in 'link' command with mailto: addresses.
 * 2. Overrides the default LinkUI balloon's "Edit" button so it opens a modal dialog.
 * 3. Leaves balloon auto-handling to LinkUI, except for our overridden button behaviors.
 */
export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;

  public static get requires() {
    // Require LinkUI so the default link balloon & 'link' command are available.
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Add the click observer (so link clicks are recognized by LinkUI).
    editor.editing.view.addObserver(ClickObserver);

    // Add a toolbar button named "alightEmailLinkPlugin".
    this._setupToolbarButton();

    // Whenever the selection changes, LinkUI may show or hide the balloon.
    // We override the default balloon's "edit" / "unlink" buttons
    // so that "edit" calls _showModal() and "unlink" calls the built-in unlink.
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      this._extendDefaultActionsView();
    });
  }

  /**
   * Creates a toolbar button named "alightEmailLinkPlugin".
   * Clicking it opens our custom modal, which then calls editor.execute('link', 'mailto:...').
   */
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);

      // The built-in 'link' command sets linkHref for us.
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

      // Bind to the built-in link command for isEnabled/isOn states.
      button.bind('isEnabled').to(linkCommand);
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // On execute, open the custom modal dialog.
      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  /**
   * Overrides the default LinkUI actions (edit/unlink).
   * - The "Edit" button calls our custom modal instead of the inline link editing.
   * - The "Unlink" button calls the built-in 'unlink' command.
   */
  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    // Access the LinkUI plugin instance
    const linkUI: any = editor.plugins.get('LinkUI');
    if (!linkUI || !linkUI.actionsView) {
      return;
    }

    // The default actions view with edit/unlink buttons.
    const actionsView: any = linkUI.actionsView;

    // 1) Override the Edit button to open our modal.
    if (actionsView.editButtonView) {
      actionsView.editButtonView.off('execute');
      actionsView.editButtonView.on('execute', () => {
        // Remove the balloon so only our modal is shown.
        const balloon = editor.plugins.get(ContextualBalloon);

        // SAFETY CHECK: Only remove it if it's actually there!
        if (balloon.hasView(actionsView)) {
          balloon.remove(actionsView);
        }

        // If there's a link in the selection, linkCommand.value holds the href string.
        const linkCommand = editor.commands.get('link');
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          // Remove mailto: if present.
          email = linkCommand.value.replace(/^mailto:/i, '');
        }
        // Open modal with the current email.
        this._showModal({ email });
      });
    }

    // 2) Override the Unlink button so it calls the built-in 'unlink' command & closes balloon.
    if (actionsView.unlinkButtonView) {
      actionsView.unlinkButtonView.off('execute');
      actionsView.unlinkButtonView.on('execute', () => {
        // If you want to remove just the href, you can do editor.execute('unlink') or editor.execute('link', null).
        editor.execute('unlink');

        const balloon = editor.plugins.get(ContextualBalloon);
        if (balloon.hasView(actionsView)) {
          balloon.remove(actionsView);
        }
      });
    }
  }

  /**
   * Opens a modal dialog. If user clicks "Continue," call editor.execute('link', 'mailto:...').
   */
  private _showModal(initialValue?: { email?: string; orgName?: string }): void {
    const editor = this.editor;

    // The built-in 'link' command sets linkHref in the model.
    const linkCommand = editor.commands.get('link');
    if (!linkCommand) {
      console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialEmail = initialValue?.email || '';
    const initialOrgName = initialValue?.orgName || '';

    if (!this._modalDialog) {
      // Create the modal once.
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

      // Handle the button clicks on the modal.
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const isValid = validateForm(form);
          if (isValid) {
            const emailInput = form.querySelector('#link-email') as HTMLInputElement;

            const emailVal = emailInput.value.trim();

            // Insert or edit the link with mailto:
            editor.model.change(() => {
              editor.execute('link', 'mailto:' + emailVal);
            });

            this._modalDialog?.hide();
          }
        }
      });
    }

    // Provide the initial email (and orgName if you want to do something with it).
    const content = ContentManager(initialEmail, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  /**
   * Clean up resources on destroy.
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}
