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

    // Helper function to create a label and input pair
    function createLabeledInput(labelText: string, inputId: string, inputType: string): HTMLElement[] {
        const label = document.createElement('label');
        label.setAttribute('for', inputId);
        label.textContent = labelText;

        const input = document.createElement('input');
        input.id = inputId;
        input.type = inputType;

        return [label, input];
    }

    // Helper function to create a paragraph with optional emphasis
    function createParagraph(text: string, emphasize: boolean = false): HTMLElement {
        const paragraph = document.createElement('p');
        if (emphasize) {
            const span = document.createElement('span');
            span.className = 'asterisk';
            span.textContent = '*';
            paragraph.appendChild(span);
        }
        paragraph.appendChild(document.createTextNode(text));
        return paragraph;
    }

    // Add the URL label and input
    const [urlLabel, urlInput] = createLabeledInput('URL', 'url', 'url');
    wrapper.appendChild(urlLabel);
    wrapper.appendChild(urlInput);

    // Add the Organization Name label and input
    const [orgNameLabel, orgNameInput] = createLabeledInput('Organization Name (Optional)', 'org-name', 'text');
    const asteriskSpan = document.createElement('span');
    asteriskSpan.className = 'asterisk';
    asteriskSpan.textContent = '*';
    orgNameLabel.appendChild(asteriskSpan);
    wrapper.appendChild(orgNameLabel);
    wrapper.appendChild(orgNameInput);

    // Add the explanatory paragraph for the organization name
    wrapper.appendChild(
        createParagraph('Enter the third-party organization to inform users the destination of the link.', true)
    );

    return wrapper;
}

export function createIntranetLink(): HTMLElement {
    const wrapper = document.createElement('div');

    // Add the informational paragraph
    const infoParagraph = document.createElement('p');
    infoParagraph.textContent =
        'Note: When an employee clicks on an intranet link, a message will let them know they need to be connected to that network to successfully continue.';
    wrapper.appendChild(infoParagraph);

    // Add the URL label and input
    const urlLabel = document.createElement('label');
    urlLabel.setAttribute('for', 'url');
    urlLabel.textContent = 'URL';
    const urlInput = document.createElement('input');
    urlInput.id = 'url';
    urlInput.type = 'url';
    wrapper.appendChild(urlLabel);
    wrapper.appendChild(urlInput);

    // Add the Organization Name label and input
    const orgNameLabel = document.createElement('label');
    orgNameLabel.setAttribute('for', 'org-name');
    orgNameLabel.textContent = 'Organization Name (Optional)';
    const asteriskSpan = document.createElement('span');
    asteriskSpan.className = 'asterisk';
    asteriskSpan.textContent = '*';
    orgNameLabel.appendChild(asteriskSpan);
    const orgNameInput = document.createElement('input');
    orgNameInput.id = 'org-name';
    orgNameInput.type = 'text';
    wrapper.appendChild(orgNameLabel);
    wrapper.appendChild(orgNameInput);

    // Add the explanatory paragraph for the organization name
    const orgNameParagraph = document.createElement('p');
    const asterisk = document.createElement('span');
    asterisk.className = 'asterisk';
    asterisk.textContent = '*';
    orgNameParagraph.appendChild(asterisk);
    orgNameParagraph.appendChild(
        document.createTextNode('Enter the third-party organization to inform users the destination of the link.')
    );
    wrapper.appendChild(orgNameParagraph);

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
