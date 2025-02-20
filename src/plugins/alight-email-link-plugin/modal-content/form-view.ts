// src/plugins/email-link/ui/email-link-form-view.ts
import { View, submitHandler } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import FormRowView from './form-row-view';

export default class AlightEmailLinkFormView extends View {
  public readonly emailInputRow: FormRowView;
  public readonly orgNameInputRow: FormRowView;
  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;

  constructor(locale: Locale) {
    super(locale);

    this.emailInputRow = this._createInputRow('Email address', 'email');
    this.orgNameInputRow = this._createInputRow('Organization name', 'text');
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
        this.orgNameInputRow
      ]
    });
  }
  private _createInputRow(label: string, type: string): FormRowView {
    const row = new FormRowView(this.locale!, {
      labelText: label,
      inputAttributes: {
        type,
        required: type === 'email'
      }
    });

    return row;
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
      this.orgNameInputRow.inputView.element
    ];

    elements.forEach(element => {
      if (element) {
        this.focusTracker.add(element);
      }
    });

    this.keystrokes.listenTo(this.element!);
  }
}