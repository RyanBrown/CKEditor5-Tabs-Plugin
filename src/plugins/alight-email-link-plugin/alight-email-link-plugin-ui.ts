// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';
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
  private _balloon!: ContextualBalloon;

  public static get requires() {
    // Require LinkUI so the default link balloon & 'link' command are available.
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Add the click observer
    editor.editing.view.addObserver(ClickObserver);

    // Setup the toolbar button
    this._setupToolbarButton();

    // Override default actions view whenever the balloon content changes
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });

    // Override the LinkUI's _showActions method
    const linkUI: any = editor.plugins.get('LinkUI');
    if (linkUI) {
      const originalShowActions = linkUI.showActions?.bind(linkUI);
      if (originalShowActions) {
        linkUI.showActions = (...args: any[]) => {
          originalShowActions(...args);
          this._extendDefaultActionsView();
        };
      }
    }
  }

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
    const linkUI: any = editor.plugins.get('LinkUI');
    if (!linkUI || !linkUI.actionsView) {
      console.log('no linkUI or actionsView');
      return;
    }

    const actionsView: any = linkUI.actionsView;
    const linkCommand = editor.commands.get('link');
    // Explicitly check if linkCommand is present and if `value` is a string
    if (!linkCommand || typeof linkCommand.value !== 'string') {
      // If there's no linkCommand or the value isn't a string,
      // we can simply return or handle that scenario differently.
      return;
    }

    let linkValue = linkCommand.value.trim().toLowerCase();
    console.log('linkValue', linkValue);

    // If it's not a mailto link, do nothing (default LinkUI behavior).
    if (!linkValue.startsWith('mailto:')) {
      console.log('not a mailto link');
      return;
    }

    // Override the edit button behavior
    if (actionsView.editButtonView) {
      // Remove all existing listeners from both the button and the actions view
      actionsView.editButtonView.off('execute');
      actionsView.off('edit'); // THIS STOPS THE DEFAULT EDIT BEHAVIOR

      // Add our custom listener with highest priority
      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        // Stop the event propagation
        evt.stop();

        // Get current link value
        const linkCommand = editor.commands.get('link');
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        // Show our modal
        this._showModal({ email });
      }, { priority: 'highest' });

      // Prevent the default 'edit' event handler
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
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

    const content = ContentManager(initialEmail, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}