export interface ModalProps {
    title?: string; // Optional modal title with a default value
    tertiaryButton?: {
        label?: string; // Optional label with a default value
        onClick?: () => void; // Optional function for cancel button click
    };
    primaryButton?: {
        label?: string; // Optional label with a default value
        onClick?: () => void; // Optional function for accept button click
    };
    content?: HTMLElement | string; // Optional modal content with a default value
    onClose?: () => void; // Callback for closing the modal
    showHeader?: boolean; // Show or hide the header (default: true)
    showFooter?: boolean; // Show or hide the footer (default: true)
}

export class ReusableModal {
    private overlay: HTMLElement;
    private modal: HTMLElement;

    constructor({
        title = 'Modal Title',
        tertiaryButton = { label: 'Cancel' },
        primaryButton = { label: 'Continue', onClick: () => {} },
        content = 'Placeholder content',
        onClose = () => {},
        showHeader = true,
        showFooter = true,
    }: ModalProps) {
        // Create the overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'ck ck-dialog-overlay';
        this.overlay.tabIndex = -1;

        // Create the modal container
        this.modal = document.createElement('div');
        this.modal.className = 'ck ck-dialog ck-dialog_modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-label', title);
        this.modal.style.top = '50%';
        this.modal.style.left = '50%';
        this.modal.style.transform = 'translate(-50%, -50%)';

        // Modal header
        if (showHeader) {
            const header = document.createElement('div');
            header.className = 'ck ck-form__header';

            const titleElement = document.createElement('h2');
            titleElement.className = 'ck ck-form__header__label';
            titleElement.textContent = title;

            const closeButton = document.createElement('button');
            closeButton.className = 'ck ck-button ck-off';
            closeButton.type = 'button';
            closeButton.innerHTML = `
                <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m11.591 10.177 4.243 4.242a1 1 0 0 1-1.415 1.415l-4.242-4.243-4.243 4.243a1 1 0 0 1-1.414-1.415l4.243-4.242L4.52 5.934A1 1 0 0 1 5.934 4.52l4.243 4.243 4.242-4.243a1 1 0 1 1 1.415 1.414l-4.243 4.243z"></path>
                </svg>
            `;
            closeButton.onclick = () => this.closeModal(onClose);

            header.appendChild(titleElement);
            header.appendChild(closeButton);
            this.modal.appendChild(header);
        }

        // Modal content
        const contentContainer = document.createElement('div');
        contentContainer.className = 'ck ck-dialog__content';
        if (typeof content === 'string') {
            contentContainer.innerHTML = content;
        } else {
            contentContainer.appendChild(content);
        }

        this.modal.appendChild(contentContainer);

        // Modal actions (footer)
        if (showFooter) {
            const actions = document.createElement('div');
            actions.className = 'ck ck-dialog__actions';

            // Cancel button
            const tertiaryButtonElement = document.createElement('button');
            tertiaryButtonElement.className = 'ck ck-button ck-button_with-text';
            tertiaryButtonElement.type = 'button';
            tertiaryButtonElement.textContent = tertiaryButton.label!;
            tertiaryButtonElement.onclick = tertiaryButton.onClick || null; // Fix: Provide fallback

            // Accept button
            const primaryButtonElement = document.createElement('button');
            primaryButtonElement.className = 'ck ck-button ck-button_action ck-button_with-text';
            primaryButtonElement.type = 'button';
            primaryButtonElement.textContent = primaryButton.label!;
            primaryButtonElement.onclick = primaryButton.onClick || null; // Fix: Provide fallback

            actions.appendChild(tertiaryButtonElement);
            actions.appendChild(primaryButtonElement);

            this.modal.appendChild(actions);
        }

        // Add modal to overlay
        this.overlay.appendChild(this.modal);

        // Add overlay to the body
        document.body.appendChild(this.overlay);

        // Add escape key listener
        document.addEventListener('keydown', this.handleKeydown);
    }

    public show(): void {
        document.body.appendChild(this.overlay);
    }

    private handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.closeModal();
        }
    };

    private closeModal(onClose?: () => void) {
        document.body.removeChild(this.overlay);
        document.removeEventListener('keydown', this.handleKeydown);

        if (onClose) {
            onClose();
        }
    }
}
