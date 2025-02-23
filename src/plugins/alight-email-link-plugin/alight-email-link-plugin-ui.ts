// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import type { Command } from '@ckeditor/ckeditor5-core';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import AlightEmailLinkPluginEditing from './alight-email-link-plugin-editing';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

interface InitialLinkData {
  email?: string;
  orgName?: string;
}

interface ModalDialogButton {
  label: string;
  variant: 'outlined' | 'default';
  shape: 'round';
  isPrimary?: boolean;
  closeOnClick?: boolean;
}

interface ModalOptions {
  title: string;
  modal: boolean;
  width: string;
  height: string;
  contentClass: string;
  buttons: ModalDialogButton[];
}

interface LinkUIActionsView extends View {
  editButtonView?: ButtonView;
  previewButtonView: ButtonView;
  href: string;
}

export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _emailLinkCommand!: AlightEmailLinkPluginCommand;
  private _linkCommand!: Command;
  private _balloon!: ContextualBalloon;
  private _editing!: AlightEmailLinkPluginEditing;

  public static get requires() {
    return [LinkUI, ContextualBalloon, AlightEmailLinkPluginEditing] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Add click observer
    editor.editing.view.addObserver(ClickObserver);

    // Get required plugins and commands
    this._balloon = editor.plugins.get(ContextualBalloon);
    this._emailLinkCommand = editor.commands.get('alightEmailLink') as AlightEmailLinkPluginCommand;
    this._linkCommand = editor.commands.get('link') as Command;
    this._editing = editor.plugins.get(AlightEmailLinkPluginEditing);

    if (!this._linkCommand) {
      throw new Error('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
    }

    // Set up UI components
    this._setupToolbarButton();

    // Setup balloon content change handler
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });

    // Get reference to LinkUI plugin and override its behavior
    const linkUI = editor.plugins.get('LinkUI');
    this._setupLinkUIOverrides(linkUI);
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

      // Bind button state to link command
      button.bind('isEnabled').to(this._linkCommand);
      button.bind('isOn').to(this._linkCommand, 'value', value => !!value);

      // Show modal dialog when clicked
      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  private _setupLinkUIOverrides(linkUI: LinkUI): void {
    if (!linkUI) return;

    // Override showActions to ensure our custom handlers are added
    const originalShowActions = (linkUI as any).showActions?.bind(linkUI);
    if (originalShowActions) {
      (linkUI as any).showActions = (...args: unknown[]) => {
        originalShowActions(...args);
        this._extendDefaultActionsView();
      };
    }

    // Override how link previews are displayed in the balloon
    const originalCreateActionsView = (linkUI as any)._createActionsView?.bind(linkUI);
    if (originalCreateActionsView) {
      (linkUI as any)._createActionsView = () => {
        const actionsView = originalCreateActionsView() as LinkUIActionsView;

        if (actionsView?.previewButtonView) {
          // Customize the display of mailto links
          actionsView.previewButtonView.unbind('label');
          actionsView.previewButtonView.unbind('tooltip');

          // Update the button label (text)
          actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
            if (!href) {
              return this.editor.t('This link has no URL');
            }
            return href.toLowerCase().startsWith('mailto:') ?
              href.substring(7) : href;
          });

          // Update the button tooltip (title)
          actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
            if (href && href.toLowerCase().startsWith('mailto:')) {
              return this.editor.t('Open email in client');
            }
            return this.editor.t('Open link in new tab');
          });
        }

        return actionsView;
      };
    }
  }

  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');

    if (!linkUI || !linkUI.actionsView) {
      return;
    }

    const actionsView: any = linkUI.actionsView;
    const linkCommand = editor.commands.get('link');

    // Validate link command and value
    if (!linkCommand || typeof linkCommand.value !== 'string') {
      return;
    }

    let linkValue = linkCommand.value.trim().toLowerCase();

    // Handle non-mailto links by removing our custom handlers
    if (!linkValue.startsWith('mailto:')) {
      if (actionsView.editButtonView) {
        actionsView.editButtonView.off('execute');
        actionsView.off('edit');
      }
      return;
    }

    // Setup custom handling for mailto links
    if (actionsView.editButtonView) {
      // Clean up existing handlers
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      // Add custom edit handler for mailto links
      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        // Extract email from mailto link
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        // Show edit modal with current email
        this._showModal({ email });
      }, { priority: 'highest' });

      // Prevent default edit behavior
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }
  }

  private _showModal(initialData?: InitialLinkData): void {
    const editor = this.editor;

    if (!this._modalDialog) {
      const modalOptions: ModalOptions = {
        title: 'Create an Email Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'email-link-content',
        buttons: [
          { label: 'Cancel', variant: 'outlined', shape: 'round' },
          { label: 'Continue', variant: 'default', isPrimary: true, shape: 'round', closeOnClick: false }
        ]
      };

      this._modalDialog = new CkAlightModalDialog(modalOptions);
      this._modalDialog.setContent(this._editing.getFormTemplate());

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

          // Create or update the mailto link
          editor.model.change(() => {
            // First create the link using the built-in link command
            editor.execute('link', `mailto:${email}`);

            // Then add our custom attributes
            editor.execute('alightEmailLink', {
              email,
              orgNameText: orgName || undefined
            });
          });

          this._modalDialog?.hide();
        }
      });
    }

    this._resetForm(initialData);
    this._modalDialog.show();

    // Focus email input after showing
    setTimeout(() => {
      const emailInput = document.querySelector('#email') as HTMLInputElement;
      emailInput?.focus();
    }, 100);
  }

  private _resetForm(initialData?: InitialLinkData): void {
    const form = document.getElementById('email-link-form');
    if (form) {
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const orgNameInput = form.querySelector('#orgName') as HTMLInputElement;
      const errorDiv = form.querySelector('.error-message') as HTMLDivElement;

      // Clear previous values and errors
      emailInput.value = '';
      orgNameInput.value = '';
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';

      // Set initial values if provided
      if (initialData?.email) {
        emailInput.value = initialData.email;
      }
      if (initialData?.orgName) {
        orgNameInput.value = initialData.orgName;
      }
    }
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}