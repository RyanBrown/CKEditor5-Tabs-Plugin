import Command from '@ckeditor/ckeditor5-core/src/command';
import type { Editor } from '@ckeditor/ckeditor5-core';
import View from '@ckeditor/ckeditor5-ui/src/view';
import InputView from '@ckeditor/ckeditor5-ui/src/input/inputview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class AlightLinkv2PluginCommand extends Command {
    private readonly optionId: string;

    constructor(editor: Editor, optionId: string) {
        super(editor);
        this.optionId = optionId;
    }

    override execute(): void {
        this._showModal(this.optionId);
    }

    private _showModal(optionId: string): void {
        const editor = this.editor;
        const { t } = editor;

        // Create the overlay container
        const overlay = document.createElement('div');
        overlay.className = 'ck ck-dialog-overlay';
        overlay.tabIndex = -1;

        // Create the modal container
        const modal = document.createElement('div');
        modal.className = 'ck ck-dialog ck-dialog_modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-label', t('Insert media'));
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';

        // Modal header
        const header = document.createElement('div');
        header.className = 'ck ck-form__header';

        const title = document.createElement('h2');
        title.className = 'ck ck-form__header__label';
        title.textContent = t('Insert media');

        const closeButton = document.createElement('button');
        closeButton.className = 'ck ck-button ck-off';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', t('Close'));
        closeButton.innerHTML = `
            <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon" viewBox="0 0 20 20" aria-hidden="true">
                <path d="m11.591 10.177 4.243 4.242a1 1 0 0 1-1.415 1.415l-4.242-4.243-4.243 4.243a1 1 0 0 1-1.414-1.415l4.243-4.242L4.52 5.934A1 1 0 0 1 5.934 4.52l4.243 4.243 4.242-4.243a1 1 0 1 1 1.415 1.414l-4.243 4.243z"></path>
            </svg>
            <span>${t('Close')}</span>
        `;

        const dismissModal = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', handleKeydown);
        };

        closeButton.onclick = dismissModal;

        header.appendChild(title);
        header.appendChild(closeButton);

        // Modal content
        const content = document.createElement('div');
        content.className = 'ck ck-dialog__content';

        const form = document.createElement('form');
        form.className = 'ck ck-media-form ck-responsive-form';

        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'ck ck-labeled-field-view ck-labeled-field-view_empty';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'ck ck-labeled-field-view__input-wrapper';

        const input = document.createElement('input');
        input.className = 'ck ck-input ck-input-text_empty ck-input-text';
        input.type = 'text';
        input.placeholder = t('Enter the media URL');

        const label = document.createElement('label');
        label.className = 'ck ck-label';
        label.textContent = t('Media URL');

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(label);

        const status = document.createElement('div');
        status.className = 'ck ck-labeled-field-view__status';
        status.textContent = t('Paste the media URL in the input.');

        fieldWrapper.appendChild(inputWrapper);
        fieldWrapper.appendChild(status);

        form.appendChild(fieldWrapper);

        content.appendChild(form);

        // Modal actions
        const actions = document.createElement('div');
        actions.className = 'ck ck-dialog__actions';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'ck ck-button ck-off ck-button_with-text';
        cancelButton.type = 'button';
        cancelButton.textContent = t('Cancel');
        cancelButton.onclick = dismissModal;

        const acceptButton = document.createElement('button');
        acceptButton.className = 'ck ck-button ck-button-action ck-off ck-button_with-text';
        acceptButton.type = 'button';
        acceptButton.textContent = t('Accept');
        acceptButton.onclick = () => {
            const url = input.value.trim();

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
        modal.appendChild(content);
        modal.appendChild(actions);

        // Add modal to overlay
        overlay.appendChild(modal);

        // Append overlay to body
        document.body.appendChild(overlay);

        // Focus the input field
        input.focus();

        // Add event listener for the Esc key
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                dismissModal();
            }
        };

        document.addEventListener('keydown', handleKeydown);
    }
}
