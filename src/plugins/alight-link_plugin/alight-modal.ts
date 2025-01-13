import './styles/alight-modal.css';

// An interface describing the shape of data returned by the modal.
export interface LinkData {
    href?: string;
    target?: string;
    rel?: string;
}

/**
 * A basic custom modal class that creates a modal in the DOM to collect
 * link properties (href, target, rel).
 *
 * The rendered HTML structure is:
 * <div class="ck-custom-modal">
 *   <header>
 *     <span class="modal-title"></span>
 *     <div>
 *       <button class="header-close">&times;</button>
 *     </div>
 *   </header>
 *   <main></main>
 *   <footer>
 *     <button class="primary">Cancel</button>
 *     <button class="secondary">Continue</button>
 *   </footer>
 * </div>
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

    public openModal(): Promise<LinkData | null> {
        return new Promise((resolve) => {
            // 1) Create overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-custom-modal-overlay');

            // 2) Create main modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-custom-modal');

            // 3) Build the header
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

            // 4) Build main section
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

            // 5) Build footer
            const footerEl = document.createElement('footer');

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.classList.add('secondary');
            cancelBtn.innerText = 'Cancel';

            // Continue (save) button
            const continueBtn = document.createElement('button');
            continueBtn.classList.add('primary');
            continueBtn.innerText = 'Continue';

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

            // 10) "Cancel" button
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
                resolve(null);
            });

            // 11) "Continue" button
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
        // Remove keydown listener
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }
}
