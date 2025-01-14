import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

import './styles/alight-link-plugin.css';

// Import your generic modal + props interface
import { CustomModal, ModalProps } from '../alight-modal/alight-modal';

// Simple interface describing link data for CKEditor commands.
export interface LinkData {
    href?: string;
    target?: string;
    rel?: string;
}

export default class AlightLinkPluginUI extends Plugin {
    static get pluginName() {
        return 'AlightLinkPluginUI';
    }

    init(): void {
        const editor = this.editor;
        const t = editor.t;

        // Add the UI button for link insertion
        editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
            // Create the basic button view
            const buttonView = createLinkFormView(locale, editor);

            // Configure the button with icon, label, and tooltip
            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Link'),
                tooltip: true,
                withText: true,
            });

            // Handle button click
            this.listenTo(buttonView, 'execute', () => {
                // Grab the editor command for inserting/updating links
                const command = editor.commands.get('alightLinkPlugin');

                // ---------------------------------------------------------------------
                // EXAMPLE #1: Use the default link fields (no props)
                // ---------------------------------------------------------------------
                /*
                const linkFieldsEl = createLinkFieldsElement();
                this.openCustomModal().then(() => {
                    // Since our generic modal always resolves with null (by default),
                    // read the link data from linkFieldsEl:
                    const linkData: LinkData = extractLinkData(linkFieldsEl);

                    // If user gave us a URL, execute the command
                    if (linkData.href) {
                        const { href, target, rel } = linkData;
                        editor.execute('alightLinkPlugin', { href, target, rel });
                    }
                });
                */

                // ---------------------------------------------------------------------
                // EXAMPLE #2: Pass custom title & button labels (still uses default link fields)
                // ---------------------------------------------------------------------
                /*
                const linkFieldsEl = createLinkFieldsElement();
                this.openCustomModal({
                    title: 'My Custom Link Title',
                    primaryBtnLabel: 'Insert',
                    secondaryBtnLabel: 'Abort'
                }).then(() => {
                    const linkData: LinkData = extractLinkData(linkFieldsEl);
                    if (linkData.href) {
                        const { href, target, rel } = linkData;
                        editor.execute('alightLinkPlugin', { href, target, rel });
                    }
                });
                */

                // ---------------------------------------------------------------------
                // EXAMPLE #3: Provide a completely custom main content (no link fields)
                // ---------------------------------------------------------------------

                // 1) Create a custom div or element to insert into the <main> of the modal
                const customDiv = document.createElement('div');
                customDiv.innerHTML = `
                    <ul class="choose-link-list">
                        <li>Alight Worklife Pages</li>
                        <li><a>Predefined Pages</a></li>
                    </ul>

                    <ul class="choose-link-list">
                        <li>External Sites</li>
                        <li><a>Public Website</a></li>
                        <li><a>Intranet</a></li>
                    </ul>

                    <ul class="choose-link-list">
                        <li>Documents</li>
                        <li><a>Existing Document</a></li>
                        <li><a>New Document</a></li>
                    </ul>
                `;

                // 2) Open the "choose a link" modal with no footer (just an example)
                //    (So user can ONLY select from these links or press Esc/× to close)
                this.openCustomModal({
                    title: 'Choose a Link',
                    mainContent: customDiv,
                    primaryBtnLabel: 'OK',
                    secondaryBtnLabel: 'Close',
                    showHeader: true,
                    showFooter: false, // no footer buttons
                }).then(() => {
                    // In this scenario, the default code in the modal resolves with null.
                    // If you need to gather data from customDiv, you'd do it here.
                    console.log('Modal closed. No link fields were present.');
                });

                // 3) Add click listeners for each <a> link inside customDiv
                //    When clicked, open a *new* modal with unique content
                customDiv.querySelectorAll('a').forEach((link) => {
                    link.addEventListener('click', (event) => {
                        event.preventDefault(); // Prevent any default <a> navigation

                        const linkText = link.textContent?.trim() || '';
                        this.handleLinkClick(linkText);
                    });
                });
            });

            return buttonView;
        });
    }

    // Opens the custom modal, returning a Promise<unknown>.
    // Accepts optional props to customize title, main content, and button labels,
    // as well as showHeader/showFooter booleans.
    private openCustomModal(props?: ModalProps): Promise<unknown> {
        const modal = new CustomModal();
        return modal.openModal(props);
    }

    // Handles clicks on any of the <a> links (Predefined Pages, Public Website, etc.).
    // We close the original "Choose a Link" modal by simply opening a new modal,
    // or you can modify code to close the first modal if needed.
    private handleLinkClick(linkText: string): void {
        let modalTitle = linkText; // default title is the link text
        let mainContentHtml: string | HTMLElement = `<p>You clicked on "${linkText}".</p>`;

        switch (linkText) {
            case 'Predefined Pages':
                modalTitle = 'Predefined Pages';
                mainContentHtml = `
                    <h2>Predefined Pages</h2>
                    <p>Here is some content about predefined pages...</p>
                `;
                break;

            case 'Public Website':
                modalTitle = 'Public Website';

                // Create the link fields instead of static text
                const linkFieldsEl = createLinkFieldsElement();

                // We'll store the DOM element as our main content
                mainContentHtml = linkFieldsEl;
                break;

            case 'Intranet':
                modalTitle = 'Intranet';
                mainContentHtml = `
                    <h2>Intranet</h2>
                    <p>Here is content about linking to your company's intranet pages...</p>
                `;
                break;

            case 'Existing Document':
                modalTitle = 'Existing Document';
                mainContentHtml = `
                    <h2>Existing Document</h2>
                    <p>Here is content about selecting an existing document...</p>
                `;
                break;

            case 'New Document':
                modalTitle = 'New Document';
                mainContentHtml = `
                    <h2>New Document</h2>
                    <p>Here is content about creating a new document to link to...</p>
                `;
                break;

            default:
                modalTitle = 'Unknown Link';
                mainContentHtml = `<p>No specific content found for "${linkText}".</p>`;
                break;
        }

        this.openCustomModal({
            title: modalTitle,
            mainContent: mainContentHtml, // This can be a string or HTMLElement
            primaryBtnLabel: 'OK',
            secondaryBtnLabel: 'Cancel',
            showHeader: true,
            showFooter: true,
        }).then(() => {
            // If you want to read the link fields after user clicks OK,
            // you'd do something like:
            if (mainContentHtml instanceof HTMLElement) {
                const linkData: LinkData = extractLinkData(mainContentHtml);
                if (linkData.href) {
                    console.log('Public Website link data:', linkData);
                    // e.g., editor.execute('alightLinkPlugin', { href: linkData.href, ... });
                }
            }
            console.log(`Modal for "${linkText}" closed.`);
        });
    }
}

// (The rest below remains unchanged.)
// If you want to do Example #1 or #2 with link fields, uncomment and adapt as needed.
function createLinkFieldsElement(): HTMLElement {
    const wrapper = document.createElement('div');

    // HREF field
    const hrefLabel = document.createElement('label');
    hrefLabel.innerText = 'URL';
    const hrefInput = document.createElement('input');
    hrefInput.type = 'text';
    hrefInput.placeholder = 'https://example.com';
    hrefInput.className = 'link-href-input'; // For easy querying
    hrefLabel.appendChild(hrefInput);

    // TARGET field
    const targetLabel = document.createElement('label');
    targetLabel.innerText = 'Link Target:';
    const targetInput = document.createElement('input');
    targetInput.type = 'text';
    targetInput.placeholder = '_blank';
    targetInput.className = 'link-target-input';
    targetLabel.appendChild(targetInput);

    // REL field
    const relLabel = document.createElement('label');
    relLabel.innerText = 'Link Rel:';
    const relInput = document.createElement('input');
    relInput.type = 'text';
    relInput.placeholder = 'nofollow';
    relInput.className = 'link-rel-input';
    relLabel.appendChild(relInput);

    // Append all labels to the wrapper
    wrapper.appendChild(hrefLabel);
    wrapper.appendChild(targetLabel);
    wrapper.appendChild(relLabel);

    return wrapper;
}

// Extracts the link data from the given HTMLElement,
// assuming it contains .link-href-input, .link-target-input, and .link-rel-input.
function extractLinkData(container: HTMLElement): LinkData {
    const hrefInput = container.querySelector('.link-href-input') as HTMLInputElement;
    const targetInput = container.querySelector('.link-target-input') as HTMLInputElement;
    const relInput = container.querySelector('.link-rel-input') as HTMLInputElement;

    const href = hrefInput?.value.trim() || '';
    const target = targetInput?.value.trim() || '';
    const rel = relInput?.value.trim() || '';

    return { href, target, rel };
}
