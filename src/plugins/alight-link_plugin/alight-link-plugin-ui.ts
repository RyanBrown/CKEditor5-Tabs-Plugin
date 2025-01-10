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

/*
 * IMPORTANT: If you are using a bundler (Webpack, Vite, etc.)
 * and want this CSS automatically included, import it here:
 */
import './styles/alight-link-plugin.css';

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
 * A basic custom modal class that
 * creates a modal in the DOM to collect
 * link properties (href, target, rel).
 *
 * All styling is handled in the .css file.
 * ========================================= */
class CustomModal {
    private overlay: HTMLDivElement | null;
    private modal: HTMLDivElement | null;

    constructor() {
        this.overlay = null;
        this.modal = null;
    }

    public openModal(): Promise<LinkData | null> {
        return new Promise((resolve) => {
            // Create overlay (with a CSS class instead of inline styles)
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-custom-modal-overlay');

            // Create modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-custom-modal');

            // Title
            const title = document.createElement('h2');
            title.innerText = 'Insert Link';
            this.modal.appendChild(title);

            // HREF field
            const hrefLabel = document.createElement('label');
            hrefLabel.innerText = 'Link HREF:';
            const hrefInput = document.createElement('input');
            hrefInput.type = 'text';
            hrefInput.placeholder = 'https://example.com';
            hrefLabel.appendChild(hrefInput);

            // TARGET field
            const targetLabel = document.createElement('label');
            targetLabel.innerText = 'Link Target:';
            const targetInput = document.createElement('input');
            targetInput.type = 'text';
            targetInput.placeholder = '_blank';
            targetLabel.appendChild(targetInput);

            // REL field
            const relLabel = document.createElement('label');
            relLabel.innerText = 'Link Rel:';
            const relInput = document.createElement('input');
            relInput.type = 'text';
            relInput.placeholder = 'nofollow';
            relLabel.appendChild(relInput);

            // Buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.innerText = 'Save';

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.innerText = 'Cancel';

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

    // Removes the modal from the DOM.
    private closeModal(): void {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
        }
        this.overlay = null;
        this.modal = null;
    }
}
