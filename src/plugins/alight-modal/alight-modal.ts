import './styles/alight-modal.css';

// Interface describing optional configuration for opening the modal.
export interface ModalProps {
    // Modal title text (header). Defaults to "Modal Title" if not provided.
    title?: string;
    // If provided, this content (string or HTMLElement)
    // will be placed into the <main> element.
    // If left empty, we'll show an empty <main>.
    mainContent?: string | HTMLElement;
    // Text label for the primary (right) button. Defaults to "Continue".
    primaryBtnLabel?: string;
    // Text label for the secondary (left) button. Defaults to "Cancel".
    secondaryBtnLabel?: string;
    // Whether to show the header (title & close button). Defaults to true.
    showHeader?: boolean;
    // Whether to show the footer (Cancel/Continue buttons). Defaults to true.
    showFooter?: boolean;
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
            secondaryBtnLabel = 'Cancel',
            showHeader = true,
            showFooter = true,
        } = props || {};

        return new Promise((resolve) => {
            // 1) Create overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-alight-modal-overlay');

            // 2) Create the main modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-alight-modal');

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
                    // Insert HTML string as inner HTML
                    mainEl.innerHTML = mainContent;
                } else {
                    // Or append an actual DOM element if given
                    mainEl.appendChild(mainContent);
                }
            } else {
                // If no content is provided, leave it empty
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
                cancelBtn.innerText = secondaryBtnLabel;

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
                    // In a purely generic modal, we don’t know about link fields.
                    // We simply resolve with null (or any custom data if you want).
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

            // If we have a header, we can do close button logic there (see above).
            // If there's no header, the user can only close via the Esc key or the footer buttons.
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
