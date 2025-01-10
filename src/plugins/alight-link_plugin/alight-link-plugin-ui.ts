/* =========================================
 * File: alight-link-plugin-ui.ts
 * Description: Defines the UI plugin that:
 *   1) Adds a toolbar button.
 *   2) Opens a custom modal (no PrimeNG) to
 *      gather link properties.
 *   3) Executes the command with the user's
 *      chosen link data.
 *   4) Closes the modal on Esc key.
 *   5) Renders the modal in the specified
 *      HTML structure (header/main/footer).
 * ========================================= */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If your bundler supports direct CSS imports, uncomment below:
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

                // Open our custom modal (vanilla TypeScript)
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
 * The rendered HTML structure is:
     <div class="ck-custom-modal">
       <header>
         <span class="modal-title"></span>
         <div>
           <button class="header-close">&times;</button>
         </div>
       </header>
       <main></main>
       <footer>
         <button class="primary">Cancel</button>
         <button class="secondary">Continue</button>
       </footer>
     </div>
 * ========================================= */
class CustomModal {
    private overlay: HTMLDivElement | null;
    private modal: HTMLDivElement | null;

    // We'll store references to remove them later
    private keyDownHandler: ((e: KeyboardEvent) => void) | null;

    constructor() {
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }

    public openModal(): Promise<LinkData | null> {
        return new Promise((resolve) => {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-custom-modal-overlay');

            // Create the main modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-custom-modal');

            // Build the header
            const headerEl = document.createElement('header');
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('modal-title');
            titleSpan.innerText = 'Insert Link';

            const headerRightDiv = document.createElement('div');
            const closeBtn = document.createElement('button');
            closeBtn.classList.add('header-close');
            closeBtn.innerText = '×';

            headerRightDiv.appendChild(closeBtn);
            headerEl.appendChild(titleSpan);
            headerEl.appendChild(headerRightDiv);

            // Build the main section
            const mainEl = document.createElement('main');

            // URL field
            const hrefLabel = document.createElement('label');
            hrefLabel.innerText = 'URL';
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

            mainEl.appendChild(hrefLabel);
            mainEl.appendChild(targetLabel);
            mainEl.appendChild(relLabel);

            // Build the footer
            const footerEl = document.createElement('footer');

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('primary');
            cancelBtn.innerText = 'Cancel';

            // Continue (save) button
            const continueBtn = document.createElement('button');
            continueBtn.classList.add('secondary'); // spelled as requested
            continueBtn.innerText = 'Continue';

            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(continueBtn);

            // Append header, main, footer to modal
            this.modal.appendChild(headerEl);
            this.modal.appendChild(mainEl);
            this.modal.appendChild(footerEl);

            // Append modal to overlay
            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            // Listen for ESC key
            this.keyDownHandler = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    this.closeModal();
                    resolve(null);
                }
            };
            window.addEventListener('keydown', this.keyDownHandler);

            // Handle the "header-close" (the "×" button)
            closeBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });

            // Handle the "Cancel" button
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });

            // Handle the "Continue" button
            continueBtn.addEventListener('click', () => {
                const data: LinkData = {
                    href: hrefInput.value.trim(),
                    target: targetInput.value.trim(),
                    rel: relInput.value.trim(),
                };
                this.closeModal();

                // If the user didn't provide any HREF, treat that as null
                if (!data.href) {
                    resolve(null);
                } else {
                    resolve(data);
                }
            });
        });
    }

    private closeModal(): void {
        // Remove overlay from the DOM
        if (this.overlay) {
            document.body.removeChild(this.overlay);
        }
        // Remove the keydown event listener
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }

        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }
}
