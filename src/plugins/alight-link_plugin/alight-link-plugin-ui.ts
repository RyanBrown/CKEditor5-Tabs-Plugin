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
                        <li>Documents</a></li>
                        <li><a>Existing Document</a></li>
                        <li><a>New Document</a></li>
                    </ul>
                `;

                // 2) Pass custom props, including mainContent
                this.openCustomModal({
                    title: 'Choose a Link',
                    mainContent: customDiv,
                    primaryBtnLabel: 'OK',
                    secondaryBtnLabel: 'Close',
                }).then(() => {
                    // In this scenario, the default code in the modal resolves with null.
                    // If you need to gather data from customDiv, you'd do it here.
                    console.log('Modal closed. No link fields were present.');
                });
            });

            return buttonView;
        });
    }

    // Opens the custom modal, returning a Promise<unknown>.
    // Accepts optional props to customize title, main content, and button labels.
    private openCustomModal(props?: ModalProps): Promise<unknown> {
        const modal = new CustomModal();
        return modal.openModal(props);
    }
}

// Creates an HTMLElement containing our "link fields":
// - URL (href)
// - Target
// - Rel
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
