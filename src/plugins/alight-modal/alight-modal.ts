import './styles/alight-modal.css';

// Interface describing optional configuration for opening the modal.
export interface ModalProps {
    title?: string; // Modal title text (header). Defaults to "Modal Title" if not provided.
    mainContent?: string | HTMLElement; // If provided, this content (string or HTMLElement) will be placed into the <main> element. If left empty, we'll show an empty <main>.
    primaryBtnLabel?: string; // Text label for the primary (right) button. Defaults to "Continue".
    tertiaryBtnLabel?: string; // Text label for the secondary (left) button. Defaults to "Cancel".
    showHeader?: boolean; // Whether to show the header (title & close button). Defaults to true.
    showFooter?: boolean; // Whether to show the footer (Cancel/Continue buttons). Defaults to true.
    width?: string; // Optional width for the modal (e.g., "400px", "50%", "auto"). Defaults to "600px".
}

// A basic custom modal class that creates a modal in the DOM,
// displaying whatever content is provided via props.
export class CustomModal {
    private overlay: HTMLDivElement | null;
    private modal: HTMLDivElement | null;
    private keyDownHandler: ((e: KeyboardEvent) => void) | null;

    constructor() {
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }

    // Opens the modal, returning a Promise<unknown>.
    // You can pass optional props to customize the modal's
    // title, main content, button labels, and whether the header/footer are shown.
    public openModal(props?: ModalProps): Promise<unknown> {
        // Destructure and provide default values
        const {
            title = 'Modal Title',
            mainContent,
            primaryBtnLabel = 'Continue',
            tertiaryBtnLabel = 'Cancel',
            showHeader = true,
            showFooter = true,
            width = '600px', // Default width
        } = props || {};

        return new Promise((resolve) => {
            // 1) Create overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-alight-modal-overlay');

            // 2) Create the main modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-alight-modal');

            // Apply the custom width via inline styles
            this.modal.style.width = width;

            // 3) (Optional) Build the header if showHeader is true
            let headerEl: HTMLElement | null = null;
            if (showHeader) {
                headerEl = document.createElement('header');

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

                // Append header to modal
                this.modal.appendChild(headerEl);

                // Listen for close button click
                closeBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });
            }

            // 4) Build the main section
            const mainEl = document.createElement('main');

            if (mainContent) {
                // If the caller provided custom content, insert it
                if (typeof mainContent === 'string') {
                    mainEl.innerHTML = mainContent;
                } else {
                    mainEl.appendChild(mainContent);
                }
            } else {
                mainEl.innerHTML = '';
            }

            // Append main to modal
            this.modal.appendChild(mainEl);

            // 5) (Optional) Build the footer if showFooter is true
            if (showFooter) {
                const footerEl = document.createElement('footer');

                // Secondary (left) button
                const cancelBtn = document.createElement('button');
                cancelBtn.classList.add('secondary');
                cancelBtn.innerText = tertiaryBtnLabel;

                // Primary (right) button
                const continueBtn = document.createElement('button');
                continueBtn.classList.add('primary');
                continueBtn.innerText = primaryBtnLabel;

                footerEl.appendChild(cancelBtn);
                footerEl.appendChild(continueBtn);
                this.modal.appendChild(footerEl);

                // Cancel button click
                cancelBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });

                // Continue button click
                continueBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });
            }

            // 6) Append modal to overlay, and overlay to body
            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            // 7) Listen for Esc key
            this.keyDownHandler = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    this.closeModal();
                    resolve(null);
                }
            };
            window.addEventListener('keydown', this.keyDownHandler);
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
