// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';
import { View, LabelView, InputTextView, submitHandler } from '@ckeditor/ckeditor5-ui';
import { Locale, FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';

export function getSelectedLinkElement(editor: Editor): Element | null {
  const view = editor.editing.view;
  const selection = view.document.selection;

  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  if (!selectedElement) {
    return null;
  }

  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}

export class FormRowView extends View {
  public readonly labelView: LabelView;
  public readonly inputView: InputTextView;

  constructor(locale: Locale, options: { labelText: string; inputAttributes?: Record<string, any> }) {
    super(locale);

    this.labelView = new LabelView(locale);
    this.labelView.text = options.labelText;

    this.inputView = new InputTextView(locale);
    if (options.inputAttributes) {
      this.inputView.extendTemplate({
        attributes: {
          ...options.inputAttributes
        }
      });
    }

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-form-row']
      },
      children: [this.labelView, this.inputView]
    });
  }

  focus(): void {
    this.inputView.focus();
  }
}

export class EmailLinkFormView extends View {
  public readonly emailInputRow: FormRowView;
  public readonly orgNameInputRow: FormRowView;
  public readonly focusTracker: import('@ckeditor/ckeditor5-utils').FocusTracker;
  public readonly keystrokes: import('@ckeditor/ckeditor5-utils').KeystrokeHandler;

  constructor(locale: import('@ckeditor/ckeditor5-utils').Locale) {
    super(locale);

    this.emailInputRow = new FormRowView(locale, {
      labelText: 'Email address',
      inputAttributes: { type: 'email', required: true }
    });

    this.orgNameInputRow = new FormRowView(locale, {
      labelText: 'Organization name',
      inputAttributes: { type: 'text' }
    });

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    this.setTemplate({
      tag: 'form',
      attributes: {
        class: ['ck', 'ck-email-link-form'],
        tabindex: '-1'
      },
      children: [this.emailInputRow, this.orgNameInputRow]
    });
  }

  focus(): void {
    this.emailInputRow.focus();
  }

  override render(): void {
    super.render();

    submitHandler({ view: this });

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
