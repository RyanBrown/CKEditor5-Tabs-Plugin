// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, submitHandler } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import './styles/alight-email-link-plugin.scss';
import { FormRowView, EmailLinkFormView } from './alight-email-link-plugin-utils';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default class AlightEmailLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _balloon!: ContextualBalloon;

  public static get requires() {
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);

    editor.editing.view.addObserver(ClickObserver);

    this._setupToolbarButton();
    this._setupBalloonBehavior();
    this._overrideLinkUIBehavior();
  }

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

      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  private _setupBalloonBehavior(): void {
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });
  }

  private _overrideLinkUIBehavior(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');

    if (linkUI) {
      const originalShowActions = linkUI.showActions?.bind(linkUI);
      if (originalShowActions) {
        linkUI.showActions = (...args: any[]) => {
          originalShowActions(...args);
          this._extendDefaultActionsView();
        };
      }

      this._overrideLinkPreviewDisplay(linkUI);
    }
  }

  private _overrideLinkPreviewDisplay(linkUI: any): void {
    const editor = this.editor;
    const originalCreateActionsView = linkUI._createActionsView?.bind(linkUI);

    if (originalCreateActionsView) {
      linkUI._createActionsView = () => {
        const actionsView = originalCreateActionsView();

        actionsView.previewButtonView.unbind('label');
        actionsView.previewButtonView.unbind('tooltip');

        actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
          if (!href) {
            return editor.t('This link has no URL');
          }
          return href.toLowerCase().startsWith('mailto:') ? href.substring(7) : href;
        });

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

  private _handleLinkRemoval(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const range = selection.getFirstRange()!;

    model.change(writer => {
      // First, remove the link
      editor.execute('unlink');

      // Then find and remove any org-name-text spans
      const items = Array.from(range.getItems());
      for (const item of items) {
        if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
          writer.remove(item);
        }
      }
    });
  }

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

    if (!linkValue.startsWith('mailto:')) {
      if (actionsView.editButtonView) {
        actionsView.editButtonView.off('execute');
        actionsView.off('edit');
      }
      return;
    }

    // Handle the edit button
    if (actionsView.editButtonView) {
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        // Get the current email address
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        // Get the current organization name if it exists
        const selection = editor.model.document.selection;
        const range = selection.getFirstRange()!;
        const items = Array.from(range.getItems());
        let orgName = '';
        for (const item of items) {
          if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
            // Extract org name from the span content, removing the parentheses
            const firstChild = item.getChild(0);
            if (firstChild && 'data' in firstChild) {
              const spanText = firstChild.data as string;
              orgName = spanText.slice(2, -1); // Remove " (" and ")"
            }
            break;
          }
        }

        this._showModal({ email, orgName });
      }, { priority: 'highest' });

      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }

    // Handle the unlink button
    if (actionsView.unlinkButtonView) {
      actionsView.unlinkButtonView.off('execute');
      actionsView.unlinkButtonView.on('execute', () => {
        this._handleLinkRemoval();
      }, { priority: 'highest' });
    }
  }

  private _showModal(initialValue?: { email?: string; orgName?: string }): void {
    const editor = this.editor;
    const linkCommand = editor.commands.get('link');

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
        contentClass: 'email-link-content',
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
            const model = editor.model;
            const selection = model.document.selection;

            model.change(writer => {
              // First apply the email link to the current selection
              editor.execute('link', 'mailto:' + emailVal);

              // Find the current selection range
              const range = selection.getFirstRange()!;
              const rangeEnd = range.end;

              // Remove any existing org name span
              const items = Array.from(range.getItems());
              for (const item of items) {
                if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
                  writer.remove(item);
                }
              }

              // If org name is provided, add it after the link
              if (orgNameVal) {
                const spanElement = writer.createElement('span', { class: 'org-name-text' });
                writer.insertText(` (${orgNameVal})`, spanElement);
                writer.insert(spanElement, rangeEnd);
              }
            });

            this._modalDialog?.hide();
          }
        }
      });
    }

    const content = this._createModalContent(initialValue?.email, initialValue?.orgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  private _createModalContent(initialEmail?: string, initialOrgName?: string): HTMLElement {
    const container = document.createElement('div');

    const formContent = `
      <form id="email-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="email" class="cka-input-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            class="cka-input-text block"
            required
            value="${initialEmail || ''}"
            placeholder="user@example.com"
          />
          <div class="error-message" id="email-error" style="display: none;">
            Please enter a valid email address.
          </div>
        </div>

        <div class="ck-form-group mt-3">
          <label for="org-name" class="cka-input-label">
            Organization Name (optional)
          </label>
          <input 
            type="text" 
            id="org-name" 
            name="orgNameInput" 
            class="cka-input-text block"
            value="${initialOrgName || ''}"
            placeholder="Organization name"
          />
        </div>

        <p class="note-text">
          Organization Name (optional): Specify the third-party organization to inform users about the email's origin.
        </p>
      </form>
    `;

    container.innerHTML = formContent;
    return container;
  }

  private _validateEmail(email: string): boolean {
    const emailInput = this._modalDialog?.element?.querySelector('#email') as HTMLInputElement;
    const emailError = this._modalDialog?.element?.querySelector('#email-error') as HTMLDivElement;

    this._hideError(emailInput, emailError);

    if (!email) {
      this._showError(emailInput, emailError, 'Email address is required.');
      return false;
    }

    if (!isValidEmail(email)) {
      this._showError(emailInput, emailError, 'Please enter a valid email address.');
      return false;
    }

    return true;
  }

  private _showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
    input.classList.add('invalid');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  private _hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
    input.classList.remove('invalid');
    errorElement.style.display = 'none';
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}