import './styles/alight-modal.css';

// Interface describing optional configuration for opening the modal.
export interface ModalProps {
    // Modal title text (header).  Defaults to "Insert Link" if not provided.
    title?: string;
    // If provided, this content will be placed into the <main> element.
    // If left empty, we'll show the default link fields (href, target, rel).
    mainContent?: string | HTMLElement;
    // Text label for the primary (right) button. Defaults to "Continue".
    primaryBtnLabel?: string;
    // Text label for the secondary (left) button. Defaults to "Cancel".
    secondaryBtnLabel?: string;
}

// An interface describing the shape of data returned by the modal.
export interface LinkData {
    href?: string;
    target?: string;
    rel?: string;
}

/**
 * A basic custom modal class that creates a modal in the DOM to collect
 * link properties (href, target, rel) OR display custom content based on passed props.
 */
export class CustomModal {
    private overlay: HTMLDivElement | null;
    private modal: HTMLDivElement | null;
    private keyDownHandler: ((e: KeyboardEvent) => void) | null;

    constructor() {
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }

    /**
     * Opens the modal, returning a Promise<LinkData | null>.
     * You can pass optional props to customize the modal's title, main content, and button labels.
     */
    public openModal(props?: ModalProps): Promise<LinkData | null> {
        // Destructure and provide default values
        const {
            title = 'Insert Link',
            mainContent,
            primaryBtnLabel = 'Continue',
            secondaryBtnLabel = 'Cancel',
        } = props || {};

        return new Promise((resolve) => {
            // 1) Create overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-alight-modal-overlay');

            // 2) Create the main modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-alight-modal');

            // 3) Build the header
            const headerEl = document.createElement('header');
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('modal-title');
            titleSpan.innerText = title;

            const headerRightDiv = document.createElement('div');
            const closeBtn = document.createElement('button');
            closeBtn.classList.add('header-close');
            closeBtn.innerText = '×';

            headerRightDiv.appendChild(closeBtn);
            headerEl.appendChild(titleSpan);
            headerEl.appendChild(headerRightDiv);

            // 4) Build the main section
            const mainEl = document.createElement('main');

            if (mainContent) {
                // If the caller provided custom content, insert it directly
                if (typeof mainContent === 'string') {
                    // Insert HTML string as the inner HTML
                    mainEl.innerHTML = mainContent;
                } else {
                    // Or append an actual DOM element if given
                    mainEl.appendChild(mainContent);
                }
            } else {
                // FALLBACK: Build the default link fields if no mainContent is provided.
                const hrefLabel = document.createElement('label');
                hrefLabel.innerText = 'URL';
                const hrefInput = document.createElement('input');
                hrefInput.type = 'text';
                hrefInput.placeholder = 'https://example.com';
                hrefLabel.appendChild(hrefInput);

                const targetLabel = document.createElement('label');
                targetLabel.innerText = 'Link Target:';
                const targetInput = document.createElement('input');
                targetInput.type = 'text';
                targetInput.placeholder = '_blank';
                targetLabel.appendChild(targetInput);

                const relLabel = document.createElement('label');
                relLabel.innerText = 'Link Rel:';
                const relInput = document.createElement('input');
                relInput.type = 'text';
                relInput.placeholder = 'nofollow';
                relLabel.appendChild(relInput);

                mainEl.appendChild(hrefLabel);
                mainEl.appendChild(targetLabel);
                mainEl.appendChild(relLabel);
            }

            // 5) Build the footer
            const footerEl = document.createElement('footer');

            // Secondary (left) button
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('secondary');
            cancelBtn.innerText = secondaryBtnLabel;

            // Primary (right) button
            const continueBtn = document.createElement('button');
            continueBtn.classList.add('primary');
            continueBtn.innerText = primaryBtnLabel;

            footerEl.appendChild(cancelBtn);
            footerEl.appendChild(continueBtn);

            // 6) Append header, main, footer to modal
            this.modal.appendChild(headerEl);
            this.modal.appendChild(mainEl);
            this.modal.appendChild(footerEl);

            // 7) Append modal to overlay, and overlay to body
            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            // 8) Listen for Esc key
            this.keyDownHandler = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    this.closeModal();
                    resolve(null);
                }
            };
            window.addEventListener('keydown', this.keyDownHandler);

            // 9) "header-close" (the "×" button)
            closeBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });

            // 10) "Cancel" (secondary) button
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });

            // 11) "Continue" (primary) button
            continueBtn.addEventListener('click', () => {
                // If the user provided custom main content, we
                // don’t have the default link fields. We’ll just resolve
                // with null or an empty object. Adjust as you see fit.
                if (mainContent) {
                    this.closeModal();
                    resolve(null);
                    return;
                }

                // If no mainContent was set, we assume the default link fields exist
                const inputs = mainEl.querySelectorAll('input');
                const hrefValue = (inputs[0] as HTMLInputElement)?.value.trim();
                const targetValue = (inputs[1] as HTMLInputElement)?.value.trim();
                const relValue = (inputs[2] as HTMLInputElement)?.value.trim();

                const data: LinkData = {
                    href: hrefValue,
                    target: targetValue,
                    rel: relValue,
                };

                this.closeModal();

                if (!data.href) {
                    // If the user didn't provide any HREF, treat that as null
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
        // Remove keydown listener
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }
}
