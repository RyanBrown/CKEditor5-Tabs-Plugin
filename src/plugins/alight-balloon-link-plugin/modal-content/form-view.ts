// src/plugins/alight-email-link-plugin/modal-content/form-view.ts

// Import necessary classes and functions from CKEditor5 UI and utilities.
import { View, submitHandler } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import FormRowView from './form-row-view';

// Represents the form view for creating or editing an email link.
// It includes input row for email address.
export default class AlightEmailLinkFormView extends View {
  // Input row for the email address.
  public readonly emailInputRow: FormRowView;
  // Tracks focus for the form elements.
  public readonly focusTracker: FocusTracker;
  // Handles keyboard events on the form.
  public readonly keystrokes: KeystrokeHandler;

  // Creates an instance of AlightEmailLinkFormView.
  // @param locale - The locale used for translations.
  constructor(locale: Locale) {
    super(locale);
    // console.log('[AlightEmailLinkFormView] Initializing form view with locale:', locale);

    // Create the input row for the email address with type 'email'.
    this.emailInputRow = this._createInputRow('Email address', 'email');
    // console.log('[AlightEmailLinkFormView] Email input row created:', this.emailInputRow);

    // Initialize focus tracking and keyboard handling.
    this.focusTracker = new FocusTracker();
    // console.log('[AlightEmailLinkFormView] FocusTracker initialized.');
    this.keystrokes = new KeystrokeHandler();
    // console.log('[AlightEmailLinkFormView] KeystrokeHandler initialized.');

    // Set the template for the form view.
    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'ck-email-link-form'],
        tabindex: '-1'
      },
      children: [
        this.emailInputRow
      ]
    });
    // console.log('[AlightEmailLinkFormView] Form template set.');
  }

  // Creates an input row for the form.
  // @param label - The label text for the input.
  // @param type - The type of the input element (e.g., 'email', 'text').
  // @returns The created FormRowView instance.
  private _createInputRow(label: string, type: string): FormRowView {
    // console.log('[AlightEmailLinkFormView] Creating input row with label:', label, 'and type:', type);
    const row = new FormRowView(this.locale!, {
      labelText: label,
      inputAttributes: {
        type,
        // Require the email field only when type is 'email'
        required: type === 'email'
      }
    });
    // console.log('[AlightEmailLinkFormView] Input row created:', row);
    return row;
  }

  // Sets focus to the email input row.
  focus(): void {
    // console.log('[AlightEmailLinkFormView] Focusing the email input row.');
    this.emailInputRow.focus();
  }

  // Renders the view.
  // This method attaches the submit handler, sets up focus tracking, and listens for keystrokes.
  override render(): void {
    // console.log('[AlightEmailLinkFormView] Rendering form view.');
    super.render();

    // Attach the submit handler to the form.
    submitHandler({
      view: this
    });
    // console.log('[AlightEmailLinkFormView] Submit handler attached.');

    // Add the form's input elements to the focus tracker.
    const elements = [
      this.emailInputRow.inputView.element
    ];
    elements.forEach(element => {
      if (element) {
        // console.log('[AlightEmailLinkFormView] Adding element to focusTracker:', element);
        this.focusTracker.add(element);
      }
    });

    // Listen for keyboard events on the form element.
    this.keystrokes.listenTo(this.element!);
    // console.log('[AlightEmailLinkFormView] KeystrokeHandler listening on form element.');
  }
}