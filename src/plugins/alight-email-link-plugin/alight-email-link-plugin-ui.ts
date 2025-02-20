// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

// Import necessary classes and components from CKEditor5.
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import { getSelectedLinkElement } from './alight-email-link-plugin-utils';
import toolBarIcon from './assets/icon-link.svg';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';
import './styles/alight-email-link-plugin.scss';
// Import the default LinkUI plugin to access its actions view.
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
// Import the view element type.
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';

/**
 * The UI component of the email link plugin.
 * It handles the toolbar button and the modal dialog.
 * This version extends the default LinkUI actions view so that custom functions
 * can be passed to its buttons without needing to manage the balloon directly.
 */
export default class AlightEmailLinkPluginUI extends Plugin {
  // Holds the reference to the modal dialog.
  private _modalDialog?: CkAlightModalDialog;

  /**
   * Specifies the required plugins.
   */
  public static get requires() {
    return [ContextualBalloon];
  }

  /**
   * Returns the plugin name.
   */
  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  /**
   * Initializes the plugin by setting up the toolbar button and click handling.
   */
  public init(): void {
    const editor = this.editor;
    // Add click observer for handling link clicks.
    editor.editing.view.addObserver(ClickObserver);
    // Setup the toolbar button.
    this._setupToolbarButton();
  }

  /**
   * Sets up the toolbar button for inserting or editing an email link.
   */
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightEmailLinkPlugin');

      if (!command) {
        console.warn('[AlightEmailLinkPluginUI] AlightEmailLinkPlugin command not found.');
        return button;
      }

      button.set({
        label: t('Email Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);

      button.on('execute', () => {
        // Open the modal dialog for creating/editing an email link.
        this._showModal();
      });

      return button;
    });
  }

  /**
   * Extends the default LinkUI actions view by assigning custom functions to its buttons.
   * This allows you to pass your custom behaviors (e.g. open your modal dialog) without having
   * to manage balloon visibility manually.
   *
   * @returns The extended actions view.
   */
  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    let defaultActionsView: View | undefined;

    try {
      // Retrieve the default LinkUI plugin's actions view.
      const linkUI: any = editor.plugins.get('LinkUI');
      defaultActionsView = linkUI.actionsView;

      if (!defaultActionsView) {
        throw new Error('Default actions view is undefined');
      }

      // The default actions view does not have typed definitions for its buttons,
      // so we cast it to any in order to override the properties.
      const actionsView: any = defaultActionsView;

      // Override the default behavior for the "edit" button.
      if (actionsView.editButtonView) {
        actionsView.editButtonView.on('execute', () => {
          console.log('[AlightEmailLinkPluginUI] Custom edit action triggered.');
          this._showModal();
        });
      }

      // Override the default behavior for the "unlink" button.
      if (actionsView.unlinkButtonView) {
        actionsView.unlinkButtonView.on('execute', () => {
          console.log('[AlightEmailLinkPluginUI] Custom unlink action triggered.');
          const command = editor.commands.get('alightEmailLinkPlugin');
          if (command) {
            command.execute(undefined);
          }
        });
      }

      // Optionally, add any additional custom content if desired.
      // For example:
      // const customContentView = new MyCustomContentView(editor.locale);
      // customContentView.render();
      // (actionsView as any).children.push(customContentView);

    } catch (error) {
      console.warn('[AlightEmailLinkPluginUI] Could not extend default actions view:', error);
    }
  }

  /**
   * Opens the modal dialog for creating or editing an email link.
   * Maintains the form and modal functionality.
   * @param initialValue Optional initial values for the email link.
   */
  public _showModal(initialValue?: { email: string; orgName?: string }): void {
    const editor = this.editor;
    const command = editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;
    const initialEmail = initialValue?.email || '';
    const initialOrgName = initialValue?.orgName || '';

    if (!this._modalDialog) {
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

      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const isValid = validateForm(form);

          if (isValid) {
            const emailInput = form?.querySelector('#link-email') as HTMLInputElement;
            const orgNameInput = form?.querySelector('#org-name') as HTMLInputElement;

            command.execute({
              email: emailInput.value,
              orgName: orgNameInput?.value || undefined
            });
            this._modalDialog?.hide();
          }
        }
      });
    }

    const content = ContentManager(initialEmail, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();

    // Extend the default actions view when the modal is shown.
    // This ensures that if the user clicks an inline link later,
    // the default balloon buttons already have your custom functions.
    this._extendDefaultActionsView();
  }

  /**
   * Destroys the plugin and cleans up resources.
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}
