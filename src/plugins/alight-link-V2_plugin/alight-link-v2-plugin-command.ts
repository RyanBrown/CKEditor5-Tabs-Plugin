import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';

interface LinkOptionData {
    title: string;
    content: string;
    acceptButton?: string;
}

export default class AlightLinkv2PluginCommand extends Command {
    private readonly data: LinkOptionData;

    constructor(editor: Editor, data: LinkOptionData) {
        super(editor);
        this.data = data;
    }

    override execute(): void {
        const { title, content, acceptButton } = this.data;
        this._showModal(title, content, acceptButton);

        console.log('Executing command with:', { title, content, acceptButton });
    }

    private _showModal(title: string, contentHtml: string, acceptButtonLabel?: string): void {
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
            <span>Close</span>
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

        const cancelButton = document.createElement('button');
        cancelButton.className = 'ck ck-button ck-off ck-button_with-text';
        cancelButton.type = 'button';
        cancelButton.textContent = 'Cancel';
        cancelButton.onclick = dismissModal;

        const acceptButton = document.createElement('button');
        acceptButton.className = 'ck ck-button ck-button-action ck-off ck-button_with-text';
        acceptButton.type = 'button';
        acceptButton.textContent = acceptButtonLabel || 'Accept'; // Fallback to 'Accept'
        acceptButton.onclick = () => {
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

        actions.appendChild(cancelButton);
        actions.appendChild(acceptButton);

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
