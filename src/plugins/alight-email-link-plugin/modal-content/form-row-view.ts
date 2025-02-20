// src/plugins/alight-email-link-plugin/modal-content/form-row-view.ts
import { View, LabelView, InputTextView } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';

export default class AlightEmailLinkFormRowView extends View {
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