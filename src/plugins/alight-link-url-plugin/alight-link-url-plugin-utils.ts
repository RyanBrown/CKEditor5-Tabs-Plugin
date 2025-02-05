// src/plugins/alight-link-url-plugin/alight-link-url-plugin-utils.ts
import {
  ButtonView,
  FocusCycler,
  LabeledFieldView,
  View,
  ViewCollection,
  submitHandler,
  type FocusableView,
  InputTextView
} from '@ckeditor/ckeditor5-ui';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';

export class LinkFormView extends View {
  public urlInputView: LabeledFieldView;
  public saveButtonView: ButtonView;
  public cancelButtonView: ButtonView;
  private _focusables: ViewCollection<FocusableView>;
  private _focusCycler: FocusCycler;
  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;

  constructor(locale: Locale, editor: Editor) {
    super(locale);

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    this.urlInputView = this._createUrlInput();
    this.saveButtonView = this._createButton('Save', 'ck-button-save');
    this.cancelButtonView = this._createButton('Cancel', 'ck-button-cancel');

    this._focusables = new ViewCollection<FocusableView>();
    this._focusCycler = new FocusCycler({
      focusables: this._focusables,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        focusPrevious: 'shift + tab',
        focusNext: 'tab'
      }
    });

    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'ck-link-form'],
        tabindex: '-1'
      },
      children: [
        this.urlInputView,
        this.saveButtonView,
        this.cancelButtonView
      ]
    });
  }

  private _createUrlInput(): LabeledFieldView {
    const t = this.locale!.t;
    const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);
    labeledInput.label = t('Link URL');
    return labeledInput;
  }

  private _createButton(label: string, className: string): ButtonView {
    const button = new ButtonView(this.locale);
    button.set({
      label,
      class: className
    });
    return button;
  }

  public override render(): void {
    super.render();

    submitHandler({
      view: this
    });

    this._focusables.add(this.urlInputView);
    this._focusables.add(this.saveButtonView);
    this._focusables.add(this.cancelButtonView);

    const elements = [
      this.urlInputView,
      this.saveButtonView,
      this.cancelButtonView
    ];

    elements.forEach(element => {
      if (element.element) {
        this.focusTracker.add(element.element);
      }
    });

    this.keystrokes.listenTo(this.element!);
  }
}

function createLabeledInputText(labeledField: LabeledFieldView) {
  const inputView = new InputTextView(labeledField.locale);

  inputView.set({
    placeholder: 'https://example.com',
    inputMode: 'text',
    id: 'link-url'
  });

  return inputView;
}

export function createLinkFormView(locale: Locale, editor: Editor): LinkFormView {
  return new LinkFormView(locale, editor);
}
