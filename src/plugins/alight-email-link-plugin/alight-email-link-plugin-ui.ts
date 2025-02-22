// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Element } from '@ckeditor/ckeditor5-engine';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import { getSelectedLinkElement } from './alight-email-link-plugin-utils';

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

export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _emailLinkCommand!: AlightEmailLinkPluginCommand;
  private _balloon!: ContextualBalloon;

  public static get requires() {
    return [LinkUI, ContextualBalloon] as const;
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

    // Set up the toolbar button
    this._setupToolbarButton();

    // Setup balloon content change handler
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });

    // Get reference to LinkUI plugin and override its behavior
    const linkUI = editor.plugins.get('LinkUI');
    this._setupLinkUIOverrides(linkUI);
  }

  private _setupLinkUIOverrides(linkUI: LinkUI): void {
    const editor = this.editor;
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
        const actionsView = originalCreateActionsView();

        if (actionsView && 'previewButtonView' in actionsView) {
          const previewView = actionsView.previewButtonView as ButtonView;
          // Customize the display of mailto links
          previewView.unbind('label');
          // Bind to actionsView's href property correctly
          previewView.bind('label').to(actionsView, 'href', (href: string) => {
            if (!href) {
              return editor.t('This link has no URL');
            }
            return href.toLowerCase().startsWith('mailto:') ?
              href.substring(7) : href;
          });
        }

        return actionsView;
      };
    }
  }

  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    const linkUI = editor.plugins.get('LinkUI');
    const actionsView = (linkUI as any).actionsView;

    if (!actionsView) {
      return;
    }

    const selectedElement = getSelectedLinkElement(editor);
    if (!selectedElement) {
      return;
    }

    const href = selectedElement.getAttribute('href') as string || '';
    if (!href.toLowerCase().startsWith('mailto:')) {
      // Remove our custom handlers for non-mailto links
      if (actionsView.editButtonView) {
        actionsView.editButtonView.off('execute', undefined, undefined);
        actionsView.off('edit', undefined, undefined);
      }
      return;
    }

    // Setup custom handling for mailto links
    if (actionsView.editButtonView) {
      // Clean up existing handlers
      actionsView.editButtonView.off('execute', undefined, undefined);
      actionsView.off('edit', undefined, undefined);

      // Add custom edit handler for mailto links
      actionsView.editButtonView.on('execute', () => {
        const email = href.replace(/^mailto:/i, '');
        const orgName = selectedElement.getAttribute('data-org-name') as string || '';

        // Show edit modal with current values
        this._showModal({ email, orgName });
      }, { priority: 'highest' });

      // Prevent default edit behavior
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }
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

        if (range) {
          this._showModal();
        }
      });

      return button;
    });
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
            orgNameText: orgName || undefined
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