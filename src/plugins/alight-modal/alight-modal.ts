import './styles/alight-modal.css';

export interface ModalProps {
    title?: string; // Modal title. Defaults to "Modal Title".
    mainContent?: string | HTMLElement; // Content for the <main> section. Defaults to empty.
    primaryBtnLabel?: string; // Label for the primary button. Defaults to "Continue".
    tertiaryBtnLabel?: string; // Label for the cancel button. Defaults to "Cancel".
    showHeader?: boolean; // Show the modal header. Defaults to true.
    showFooter?: boolean; // Show the modal footer. Defaults to true.
    width?: string; // Modal width. Defaults to "600px".
}

export class CustomModal {
    private overlay: HTMLDivElement | null = null;
    private modal: HTMLDivElement | null = null;
    private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

    // Opens the modal and returns a Promise that resolves on user action.
    public openModal(props?: ModalProps): Promise<unknown> {
        const {
            title = 'Modal Title',
            mainContent,
            primaryBtnLabel = 'Continue',
            tertiaryBtnLabel = 'Cancel',
            showHeader = true,
            showFooter = true,
            width = '600px',
        } = props || {};

        return new Promise((resolve) => {
            // Create modal overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('ck-alight-modal-overlay');

            // Create modal container
            this.modal = document.createElement('div');
            this.modal.classList.add('ck-alight-modal');
            this.modal.style.width = width;

            // Add header if enabled
            if (showHeader) {
                const headerEl = document.createElement('header');
                const titleSpan = document.createElement('span');
                titleSpan.classList.add('modal-title');
                titleSpan.textContent = title;

                const closeBtn = document.createElement('button');
                closeBtn.classList.add('header-close');
                closeBtn.textContent = '×';
                closeBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });

                headerEl.append(titleSpan, closeBtn);
                this.modal.appendChild(headerEl);
            }

            // Add main content
            const mainEl = document.createElement('main');
            if (mainContent) {
                if (typeof mainContent === 'string') {
                    mainEl.textContent = mainContent;
                } else {
                    mainEl.appendChild(mainContent);
                }
            }
            this.modal.appendChild(mainEl);

            // Add footer if enabled
            if (showFooter) {
                const footerEl = document.createElement('footer');
                const cancelBtn = document.createElement('button');
                cancelBtn.classList.add('secondary');
                cancelBtn.textContent = tertiaryBtnLabel;
                cancelBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });

                const continueBtn = document.createElement('button');
                continueBtn.classList.add('primary');
                continueBtn.textContent = primaryBtnLabel;
                continueBtn.addEventListener('click', () => {
                    this.closeModal();
                    resolve(null);
                });

                footerEl.append(cancelBtn, continueBtn);
                this.modal.appendChild(footerEl);
            }

            // Append modal to overlay and overlay to body
            this.overlay.appendChild(this.modal);
            document.body.appendChild(this.overlay);

            // Handle Esc key to close the modal
            this.keyDownHandler = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    this.closeModal();
                    resolve(null);
                }
            };
            window.addEventListener('keydown', this.keyDownHandler);
        });
    }

    // Closes the modal and cleans up event listeners
    private closeModal(): void {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
        }
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
        }
        this.overlay = null;
        this.modal = null;
        this.keyDownHandler = null;
    }
}
