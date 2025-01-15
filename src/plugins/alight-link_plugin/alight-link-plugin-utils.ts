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
    target: 'linkTarget',
    rel: 'linkRel',
};

// Utility functions for modal content and link data extraction.

export function createPublicWebsiteLink(): HTMLElement {
    const wrapper = document.createElement('div');

    const hrefLabel = document.createElement('label');
    hrefLabel.innerText = 'URL';
    const hrefInput = document.createElement('input');
    hrefInput.type = 'text';
    hrefInput.placeholder = 'https://example.com';
    hrefInput.className = 'link-href-input';
    hrefLabel.appendChild(hrefInput);

    const targetLabel = document.createElement('label');
    targetLabel.innerText = 'Link Target:';
    const targetInput = document.createElement('input');
    targetInput.type = 'text';
    targetInput.placeholder = '_blank';
    targetInput.className = 'link-target-input';
    targetLabel.appendChild(targetInput);

    const relLabel = document.createElement('label');
    relLabel.innerText = 'Link Rel:';
    const relInput = document.createElement('input');
    relInput.type = 'text';
    relInput.placeholder = 'nofollow';
    relInput.className = 'link-rel-input';
    relLabel.appendChild(relInput);

    wrapper.appendChild(hrefLabel);
    wrapper.appendChild(targetLabel);
    wrapper.appendChild(relLabel);

    return wrapper;
}

export function createIntranetLink(): HTMLElement {
    const wrapper = document.createElement('div');

    const hrefLabel = document.createElement('label');
    hrefLabel.innerText = 'URL';
    const hrefInput = document.createElement('input');
    hrefInput.type = 'text';
    hrefInput.placeholder = 'https://example.com';
    hrefInput.className = 'link-href-input';
    hrefLabel.appendChild(hrefInput);

    const targetLabel = document.createElement('label');
    targetLabel.innerText = 'Link Target:';
    const targetInput = document.createElement('input');
    targetInput.type = 'text';
    targetInput.placeholder = '_blank';
    targetInput.className = 'link-target-input';
    targetLabel.appendChild(targetInput);

    wrapper.appendChild(hrefLabel);
    wrapper.appendChild(targetLabel);

    return wrapper;
}

export interface LinkData {
    href?: string;
    target?: string;
    rel?: string;
}

export function extractLinkData(container: HTMLElement): LinkData {
    const hrefInput = container.querySelector('.link-href-input') as HTMLInputElement;
    const targetInput = container.querySelector('.link-target-input') as HTMLInputElement;
    const relInput = container.querySelector('.link-rel-input') as HTMLInputElement;

    const href = hrefInput?.value.trim() || '';
    const target = targetInput?.value.trim() || '';
    const rel = relInput?.value.trim() || '';

    return { href, target, rel };
}
