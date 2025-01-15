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
export function createLinkView(
    options: {
        includeInfoParagraph?: string; // Optional informational paragraph
        includeURLInput?: boolean; // Whether to include URL input
        includeOrgNameInput?: boolean; // Whether to include Organization Name input
    } = {}
): HTMLElement {
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

    // Add optional informational paragraph
    if (options.includeInfoParagraph) {
        wrapper.appendChild(createParagraph(options.includeInfoParagraph));
    }

    // Add URL label and input if specified
    if (options.includeURLInput) {
        const [urlLabel, urlInput] = createLabeledInput('URL', 'url', 'url');
        wrapper.appendChild(urlLabel);
        wrapper.appendChild(urlInput);
    }

    // Add Organization Name label and input if specified
    if (options.includeOrgNameInput) {
        const [orgNameLabel, orgNameInput] = createLabeledInput('Organization Name (Optional)', 'org-name', 'text');
        const asteriskSpan = document.createElement('span');
        asteriskSpan.className = 'asterisk';
        asteriskSpan.textContent = '*';
        orgNameLabel.appendChild(asteriskSpan);
        wrapper.appendChild(orgNameLabel);
        wrapper.appendChild(orgNameInput);

        // Add explanatory paragraph for the organization name
        wrapper.appendChild(
            createParagraph('Enter the third-party organization to inform users the destination of the link.', true)
        );
    }

    return wrapper;
}
export function createPublicWebsiteLink(): HTMLElement {
    return createLinkView({
        includeURLInput: true,
        includeOrgNameInput: true,
    });
}

export function createIntranetLink(): HTMLElement {
    return createLinkView({
        includeInfoParagraph: `Note: When an employee clicks on an intranet link, 
                               a message will let them know they need to be connected 
                               to that network to successfully continue.`,
        includeURLInput: true,
        includeOrgNameInput: true,
    });
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
