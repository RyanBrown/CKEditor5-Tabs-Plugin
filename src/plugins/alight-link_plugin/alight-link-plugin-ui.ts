/* =========================================
 * File: alight-link-plugin-ui.ts
 * Description: Defines the UI plugin that:
 *   1) Adds a toolbar button.
 *   2) Opens a custom modal (no PrimeNG) to
 *      gather link properties.
 *   3) Executes the command with the user's
 *      chosen link data.
 * ========================================= */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

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
                const command = editor.commands.get('alightLinkPlugin');

                // Open our custom modal (vanilla TypeScript, no PrimeNG).
                this.openCustomModal().then((linkData: LinkData | null) => {
                    if (linkData) {
                        const { href, target, rel } = linkData;
                        // Execute the command with the retrieved properties
                        editor.execute('alightLinkPlugin', { href, target, rel });
                    }
                });
            });

            return buttonView;
        });
    }

    /**
     * Opens the custom modal, returning a Promise of LinkData or null.
     */
    private openCustomModal(): Promise<LinkData | null> {
        const modal = new CustomModal();
        return modal.openModal();
    }
}

/**
 * An interface describing the shape of data returned by the modal.
 */
interface LinkData {
    href?: string;
    target?: string;
    rel?: string;
}

/* =========================================
 * A very basic custom modal class that
 * creates a modal in the DOM to collect
 * link properties (href, target, rel).
 * ========================================= */
class CustomModal {
    private overlay: HTMLDivElement | null;
    private modal: HTMLDivElement | null;

    constructor() {
        this.overlay = null;
        this.modal = null;
    }

    /**
     * Creates and opens the modal in the DOM.
     * Returns a Promise<LinkData | null> that resolves with user input
     * or null if cancelled/closed.
     */
    public openModal(): Promise<LinkData | null> {
        return new Promise((resolve) => {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.style.position = 'fixed';
            this.overlay.style.top = '0';
            this.overlay.style.left = '0';
            this.overlay.style.width = '100vw';
            this.overlay.style.height = '100vh';
            this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.overlay.style.display = 'flex';
            this.overlay.style.alignItems = 'center';
            this.overlay.style.justifyContent = 'center';
            this.overlay.style.zIndex = '9999';

            // Create modal container
            this.modal = document.createElement('div');
            this.modal.style.backgroundColor = '#fff';
            this.modal.style.padding = '1rem';
            this.modal.style.borderRadius = '5px';
            this.modal.style.minWidth = '300px';
            this.modal.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            this.modal.style.display = 'flex';
            this.modal.style.flexDirection = 'column';
            this.modal.style.gap = '0.5rem';

            // Title
            const title = document.createElement('h2');
            title.innerText = 'Insert Link';
            this.modal.appendChild(title);

            // HREF field
            const hrefLabel = document.createElement('label');
            hrefLabel.innerText = 'Link HREF:';
            hrefLabel.style.display = 'block';
            const hrefInput = document.createElement('input');
            hrefInput.type = 'text';
            hrefInput.placeholder = 'https://example.com';
            hrefInput.style.display = 'block';
            hrefInput.style.marginTop = '0.25rem';
            hrefLabel.appendChild(hrefInput);

            // TARGET field
            const targetLabel = document.createElement('label');
            targetLabel.innerText = 'Link Target:';
            targetLabel.style.display = 'block';
            const targetInput = document.createElement('input');
            targetInput.type = 'text';
            targetInput.placeholder = '_blank';
            targetInput.style.display = 'block';
            targetInput.style.marginTop = '0.25rem';
            targetLabel.appendChild(targetInput);

            // REL field
            const relLabel = document.createElement('label');
            relLabel.innerText = 'Link Rel:';
            relLabel.style.display = 'block';
            const relInput = document.createElement('input');
            relInput.type = 'text';
            relInput.placeholder = 'nofollow';
            relInput.style.display = 'block';
            relInput.style.marginTop = '0.25rem';
            relLabel.appendChild(relInput);

            // Buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.justifyContent = 'flex-end';
            buttonsContainer.style.gap = '0.5rem';
            buttonsContainer.style.marginTop = '1rem';

            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.innerText = 'Save';
            saveBtn.style.padding = '0.5rem 1rem';
            saveBtn.style.cursor = 'pointer';

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = 'Cancel';
            cancelBtn.style.padding = '0.5rem 1rem';
            cancelBtn.style.cursor = 'pointer';

            // Append elements
            buttonsContainer.appendChild(saveBtn);
            buttonsContainer.appendChild(cancelBtn);
            this.modal.appendChild(hrefLabel);
            this.modal.appendChild(targetLabel);
            this.modal.appendChild(relLabel);
            this.modal.appendChild(buttonsContainer);
            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            // Save button event
            saveBtn.addEventListener('click', () => {
                const data: LinkData = {
                    href: hrefInput.value.trim(),
                    target: targetInput.value.trim(),
                    rel: relInput.value.trim(),
                };
                this.closeModal();

                // If the user didn't provide any HREF, treat it as null
                if (!data.href) {
                    resolve(null);
                } else {
                    resolve(data);
                }
            });

            // Cancel button event
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });
        });
    }

    /**
     * Removes the modal from the DOM.
     */
    private closeModal(): void {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
        }
        this.overlay = null;
        this.modal = null;
    }
}
