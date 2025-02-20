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
 * It handles the toolbar button, modal dialog, and extends default link click behavior.
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
   * Initializes the plugin by setting up the toolbar button, extending the default click handling,
   * and listening to selection changes.
   */
  public init(): void {
    const editor = this.editor;

    // Add the click observer.
    editor.editing.view.addObserver(ClickObserver);

    // Extend the default link click handling (if available).
    this._extendDefaultClickHandler();

    // Setup the toolbar button.
    this._setupToolbarButton();

    // Listen to selection changes to extend default actions view and display the balloon when a link is selected.
    editor.model.document.selection.on('change:range', () => {
      const linkElement = getSelectedLinkElement(editor);
      if (linkElement) {
        console.log('[AlightEmailLinkPluginUI] Link selected via default handling.');
        this._extendDefaultActionsView();

        // Force the default LinkUI balloon to show.
        const linkUI: any = editor.plugins.get('LinkUI');
        if (linkUI && typeof linkUI.showActions === 'function') {
          linkUI.showActions();
        }
      }
    });
  }

  /**
   * Extends the default click handling of the LinkUI plugin by wrapping its internal _handleLinkClick method.
   * This approach leverages the default behavior and adds your custom logic.
   */
  private _extendDefaultClickHandler(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');

    // Add a click handler for email links
    this.editor.editing.view.document.on('click', (evt, data) => {
      // Check if clicked element is a link
      const domEvent = data.domEvent;
      const target = domEvent.target as HTMLElement;

      if (target.tagName.toLowerCase() === 'a' && target.classList.contains('email-link')) {
        // Prevent default link behavior
        domEvent.preventDefault();

        // Show the balloon
        if (linkUI && typeof linkUI.showActions === 'function') {
          // Force selection update to ensure proper balloon positioning
          const viewElement = data.target;
          const modelElement = editor.editing.mapper.toModelElement(viewElement);

          if (modelElement) {
            editor.model.change(writer => {
              writer.setSelection(modelElement, 'on');
            });
          }

          linkUI.showActions();
        }
      }
    });

    // Keep original click handler functionality if it exists
    if (linkUI && typeof linkUI._handleLinkClick === 'function') {
      const originalClickHandler = linkUI._handleLinkClick.bind(linkUI);
      linkUI._handleLinkClick = (evt: any, data: any) => {
        originalClickHandler(evt, data);
      };
    }
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
   * This method checks if the default actions view is available and, if so, overrides its
   * button behaviors.
   */
  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');

    // Check if the default actions view is available.
    if (!linkUI || !linkUI.actionsView) {
      return;
    }

    const actionsView: any = linkUI.actionsView;

    // Override the default behavior for the "edit" button.
    if (actionsView.editButtonView) {
      actionsView.editButtonView.off('execute'); // remove existing listeners
      actionsView.editButtonView.on('execute', () => {
        console.log('[AlightEmailLinkPluginUI] Custom edit action triggered.');
        this._showModal();
      });
    }

    // Override the default behavior for the "unlink" button.
    if (actionsView.unlinkButtonView) {
      actionsView.unlinkButtonView.off('execute');
      actionsView.unlinkButtonView.on('execute', () => {
        console.log('[AlightEmailLinkPluginUI] Custom unlink action triggered.');
        const command = editor.commands.get('alightEmailLinkPlugin');
        if (command) {
          command.execute(undefined);
        }
      });
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
  }

  /**
   * Destroys the plugin and cleans up resources.
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}
