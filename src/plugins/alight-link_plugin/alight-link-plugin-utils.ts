// alight-link-plugin-utils.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Locale } from '@ckeditor/ckeditor5-utils';

// A helper function that creates a ButtonView.
// In a more complex plugin, this could create a more advanced UI for link insertion.
export function createLinkFormView(locale: Locale, editor: Editor): ButtonView {
  return new ButtonView(locale);
}

// Exported link attributes, could be used if you want to refer to them in multiple places.
export const linkAttributes = {
  href: 'linkHref',
};
