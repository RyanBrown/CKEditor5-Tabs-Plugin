import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';

interface LinkOptionData {
    title: string;
    content: string;
    primaryButton?: string;
}

export default class AlightLinkv2PluginCommand extends Command {
    private readonly data: LinkOptionData;

    constructor(editor: Editor, data: LinkOptionData) {
        super(editor);
        this.data = data;
    }

    override execute(): void {
        const { title, content, primaryButton } = this.data;
        this._showModal(title, content, primaryButton);

        console.log('Executing command with:', { title, content, primaryButton });
    }

    private _showModal(title: string, contentHtml: string, primaryButtonLabel?: string): void {
        const editor = this.editor;

        // Create the overlay container
        const overlay = document.createElement('div');
        overlay.className = 'ck ck-dialog-overlay';
        overlay.tabIndex = -1;

        // Create the modal container
        const modal = document.createElement('div');
        modal.className = 'ck ck-dialog ck-dialog_modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', title);
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';

        // Modal header
        const header = document.createElement('div');
        header.className = 'ck ck-form__header';

        const titleElement = document.createElement('h2');
        titleElement.className = 'ck ck-form__header__label';
        titleElement.textContent = title;

        const closeButton = document.createElement('button');
        closeButton.className = 'ck ck-button ck-off';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = `
            <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon" viewBox="0 0 20 20" aria-hidden="true">
                <path d="m11.591 10.177 4.243 4.242a1 1 0 0 1-1.415 1.415l-4.242-4.243-4.243 4.243a1 1 0 0 1-1.414-1.415l4.243-4.242L4.52 5.934A1 1 0 0 1 5.934 4.52l4.243 4.243 4.242-4.243a1 1 0 1 1 1.415 1.414l-4.243 4.243z"></path>
            </svg>
        `;

        const dismissModal = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleKeydown);
        };

        closeButton.onclick = dismissModal;

        header.appendChild(titleElement);
        header.appendChild(closeButton);

        // Modal content
        const contentContainer = document.createElement('div');
        contentContainer.className = 'ck ck-dialog__content';
        contentContainer.innerHTML = contentHtml; // Use the dynamic content HTML

        // Modal actions
        const actions = document.createElement('div');
        actions.className = 'ck ck-dialog__actions';

        const tertiaryButton = document.createElement('button');
        tertiaryButton.className = 'ck ck-button ck-off ck-button_with-text';
        tertiaryButton.type = 'button';
        tertiaryButton.textContent = 'Cancel';
        tertiaryButton.onclick = dismissModal;

        const primaryButton = document.createElement('button');
        primaryButton.className = 'ck ck-button ck-button-action ck-off ck-button_with-text';
        primaryButton.type = 'button';
        primaryButton.textContent = primaryButtonLabel || 'Accept'; // Fallback to 'Accept'
        primaryButton.onclick = () => {
            const input = contentContainer.querySelector('input') as HTMLInputElement;
            const url = input?.value.trim();

            if (url) {
                editor.model.change((writer) => {
                    const selection = editor.model.document.selection;
                    const range = selection.getFirstRange();

                    writer.setAttribute('linkHref', url, range!);
                });

                dismissModal();
            }
        };

        actions.appendChild(tertiaryButton);
        actions.appendChild(primaryButton);

        // Assemble the modal
        modal.appendChild(header);
        modal.appendChild(contentContainer);
        modal.appendChild(actions);

        // Add modal to overlay
        overlay.appendChild(modal);

        // Append overlay to body
        document.body.appendChild(overlay);

        // Focus the input field if present
        const input = contentContainer.querySelector('input') as HTMLInputElement;
        input?.focus();

        // Add event listener for the Esc key
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                dismissModal();
            }
        };

        document.addEventListener('keydown', handleKeydown);
    }
}
