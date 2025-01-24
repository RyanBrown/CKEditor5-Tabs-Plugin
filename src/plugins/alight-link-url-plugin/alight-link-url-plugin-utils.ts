// src/plugins/alight-link-url-plugin/alight-link-url-plugin-utils.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Locale } from '@ckeditor/ckeditor5-utils';

export function createLinkFormView(locale: Locale, editor: Editor): ButtonView {
  // Minimal example: just a ButtonView
  return new ButtonView(locale);
}
