// src/plugins/alight-email-link-plugin/modal-content/form-row-view.ts

// Import necessary classes from CKEditor5 UI and utilities.
import { View, LabelView, InputTextView } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';

// Represents a single form row view which consists of a label and an input field.
export default class AlightEmailLinkFormRowView extends View {
  // View for displaying the label.
  public readonly labelView: LabelView;
  // View for displaying the input text field.
  public readonly inputView: InputTextView;

  // Creates an instance of AlightEmailLinkFormRowView.
  // @param locale - The locale instance for internationalization.
  // @param options - Configuration options containing the label text and optional input attributes.
  constructor(
    locale: Locale,
    options: { labelText: string; inputAttributes?: Record<string, any> }
  ) {
    super(locale);
    console.log('[AlightEmailLinkFormRowView] Initializing form row view with options:', options);

    // Create the label view using the provided label text.
    this.labelView = this._createLabelView(options.labelText);
    console.log('[AlightEmailLinkFormRowView] Label view created:', this.labelView);

    // Create the input view using the provided attributes (if any).
    this.inputView = this._createInputView(options.inputAttributes);
    console.log('[AlightEmailLinkFormRowView] Input view created:', this.inputView);

    // Set the template for the form row view container.
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
    console.log('[AlightEmailLinkFormRowView] Template set for form row view.');
  }

  // Creates the label view for the form row.
  // @param text - The text to be displayed in the label.
  // @returns The created LabelView instance.
  private _createLabelView(text: string): LabelView {
    console.log('[AlightEmailLinkFormRowView] Creating label view with text:', text);
    const label = new LabelView(this.locale);
    label.text = text;
    console.log('[AlightEmailLinkFormRowView] Label view initialized:', label);
    return label;
  }

  // Creates the input view for the form row.
  // @param attributes - Optional attributes to extend the input template.
  // @returns The created InputTextView instance.
  private _createInputView(attributes?: Record<string, any>): InputTextView {
    console.log('[AlightEmailLinkFormRowView] Creating input view with attributes:', attributes);
    const input = new InputTextView(this.locale);

    // Extend the input view template with any provided attributes.
    if (attributes) {
      input.extendTemplate({
        attributes: {
          ...attributes
        }
      });
      console.log('[AlightEmailLinkFormRowView] Input view template extended with attributes.');
    }

    console.log('[AlightEmailLinkFormRowView] Input view created:', input);
    return input;
  }

  // Sets focus on the input view.
  focus(): void {
    console.log('[AlightEmailLinkFormRowView] Focusing input view.');
    this.inputView.focus();
  }
}
