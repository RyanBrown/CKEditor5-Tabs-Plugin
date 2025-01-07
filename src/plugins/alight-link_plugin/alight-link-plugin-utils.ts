import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Locale } from '@ckeditor/ckeditor5-utils';

export function createLinkFormView(locale: Locale, editor: Editor): ButtonView {
    return new ButtonView(locale);
}

export const linkAttributes = {
    href: 'linkHref',
};
