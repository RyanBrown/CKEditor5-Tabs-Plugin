// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, LabelView, InputTextView, submitHandler } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import toolBarIcon from './assets/icon-link.svg';
import { FocusTracker, KeystrokeHandler, type Locale } from '@ckeditor/ckeditor5-utils';
import './styles/alight-email-link-plugin.scss';

// Form Row View Class
class AlightEmailLinkFormRowView extends View {
  public readonly labelView: LabelView;
  public readonly inputView: InputTextView;

  constructor(
    locale: Locale,
    options: { labelText: string; inputAttributes?: Record<string, any> }
  ) {
    super(locale);

    this.labelView = this._createLabelView(options.labelText);
    this.inputView = this._createInputView(options.inputAttributes);

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-form-row']
      },
      children: [
        this.labelView,
        this.inputView
      ]
    });
  }

  private _createLabelView(text: string): LabelView {
    const label = new LabelView(this.locale);
    label.text = text;
    return label;
  }

  private _createInputView(attributes?: Record<string, any>): InputTextView {
    const input = new InputTextView(this.locale);
    if (attributes) {
      input.extendTemplate({
        attributes: {
          ...attributes
        }
      });
    }
    return input;
  }

  focus(): void {
    this.inputView.focus();
  }
}

// Form View Class
class AlightEmailLinkFormView extends View {
  public readonly emailInputRow: AlightEmailLinkFormRowView;
  public readonly orgNameTextInputRow: AlightEmailLinkFormRowView;
  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;

  constructor(locale: Locale) {
    super(locale);

    this.emailInputRow = this._createInputRow('Email address', 'email');
    this.orgNameTextInputRow = this._createInputRow('Organization name', 'text');
    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'ck-email-link-form'],
        tabindex: '-1'
      },
      children: [
        this.emailInputRow,
        this.orgNameTextInputRow
      ]
    });
  }

  private _createInputRow(label: string, type: string): AlightEmailLinkFormRowView {
    return new AlightEmailLinkFormRowView(this.locale!, {
      labelText: label,
      inputAttributes: {
        type,
        required: type === 'email'
      }
    });
  }

  focus(): void {
    this.emailInputRow.focus();
  }

  override render(): void {
    super.render();

    submitHandler({
      view: this
    });

    const elements = [
      this.emailInputRow.inputView.element,
      this.orgNameTextInputRow.inputView.element
    ];
    elements.forEach(element => {
      if (element) {
        this.focusTracker.add(element);
      }
    });

    this.keystrokes.listenTo(this.element!);
  }
}

// Content Manager Functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
  input.classList.add('invalid');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
  input.classList.remove('invalid');
  errorElement.style.display = 'none';
}

function validateForm(form: HTMLFormElement): boolean {
  const emailInput = form.querySelector('#link-email') as HTMLInputElement;
  const emailError = form.querySelector('#email-error') as HTMLDivElement;
  let value = emailInput.value.trim();

  if (value.toLowerCase().startsWith('mailto:')) {
    value = value.replace(/^mailto:/i, '').trim();
    emailInput.value = value;
  }

  hideError(emailInput, emailError);

  if (!value) {
    showError(emailInput, emailError, 'Email address is required.');
    return false;
  }

  if (!isValidEmail(value)) {
    showError(emailInput, emailError, 'Please enter a valid email address.');
    return false;
  }

  return true;
}

function ContentManager(initialValue?: string, initialOrgNameText?: string): HTMLElement {
  const container = document.createElement('div');

  const formContent = `
      <form id="email-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="link-email" class="cka-input-label">
            Email Address
          </label>
          <input 
            type="email" 
            id="link-email" 
            name="email" 
            class="cka-input-text block" 
            required
            value="${initialValue || ''}"
            placeholder="user@example.com"
          />
          <div 
            class="error-message" 
            id="email-error" 
            style="display: none;"
          >
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
            name="orgNameText" 
            class="cka-input-text block"
            value="${initialOrgNameText || ''}"
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

// Main Plugin UI Class
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

    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });

    const linkUI: any = editor.plugins.get('LinkUI');
    if (linkUI) {
      const originalShowActions = linkUI.showActions?.bind(linkUI);
      if (originalShowActions) {
        linkUI.showActions = (...args: any[]) => {
          originalShowActions(...args);
          this._extendDefaultActionsView();
        };
      }

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
            return href.toLowerCase().startsWith('mailto:') ?
              href.substring(7) : href;
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
  }

  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);

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

      button.bind('isEnabled').to(linkCommand);
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      button.on('execute', () => {
        this._showModal();
      });

      return button;
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

    if (actionsView.editButtonView) {
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        this._showModal({ email });
      }, { priority: 'highest' });

      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }
  }

  private _showModal(initialValue?: { email?: string; orgNameText?: string }): void {
    const editor = this.editor;

    const linkCommand = editor.commands.get('link');
    if (!linkCommand) {
      console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialEmail = initialValue?.email || '';
    const initialOrgNameText = initialValue?.orgNameText || '';

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
            const emailInput = form.querySelector('#link-email') as HTMLInputElement;
            const emailVal = emailInput.value.trim();

            editor.model.change(() => {
              editor.execute('link', 'mailto:' + emailVal);
            });

            this._modalDialog?.hide();
          }
        }
      });
    }

    const content = ContentManager(initialEmail, initialOrgNameText);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}