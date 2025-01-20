import Command from '@ckeditor/ckeditor5-core/src/command';
import type { Editor } from '@ckeditor/ckeditor5-core';

export default class AlightLinkv2PluginCommand extends Command {
    private readonly optionId: string;

    constructor(editor: Editor, optionId: string) {
        super(editor);
        this.optionId = optionId;
    }

    override execute(): void {
        this._showDialog(this.optionId);
    }

    private _showDialog(optionId: string): void {
        const { t } = this.editor;

        // Dialog content for each option
        const dialogContent =
            {
                linkOption1: t('Content for Predefined Pages'),
                linkOption2: t('Content for Public Website'),
                linkOption3: t('Content for Intranet'),
                linkOption4: t('Content for Existing Document'),
                linkOption5: t('Content for New Document'),
            }[optionId] || t('Default Content');

        // Create the overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '9998';

        // Create the modal dialog
        const dialogWrapper = document.createElement('div');
        dialogWrapper.style.position = 'fixed';
        dialogWrapper.style.top = '50%';
        dialogWrapper.style.left = '50%';
        dialogWrapper.style.transform = 'translate(-50%, -50%)';
        dialogWrapper.style.padding = '16px';
        dialogWrapper.style.border = '1px solid #ccc';
        dialogWrapper.style.borderRadius = '8px';
        dialogWrapper.style.backgroundColor = '#fff';
        dialogWrapper.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        dialogWrapper.style.zIndex = '9999';

        const dialogContentWrapper = document.createElement('div');
        dialogContentWrapper.innerHTML = `
            <h2>${t('Link Option Dialog')}</h2>
            <p>${dialogContent}</p>
            <button id="closeDialog" style="margin-top: 8px; padding: 4px 8px;">${t('Close')}</button>
        `;
        dialogWrapper.appendChild(dialogContentWrapper);

        // Append the overlay and dialog to the body
        document.body.appendChild(overlay);
        document.body.appendChild(dialogWrapper);

        // Close the dialog and overlay on button click
        const closeDialog = () => {
            document.body.removeChild(dialogWrapper);
            document.body.removeChild(overlay);
        };

        dialogContentWrapper.querySelector('#closeDialog')?.addEventListener('click', closeDialog);

        // Close the dialog and overlay when clicking on the overlay
        overlay.addEventListener('click', closeDialog);
    }
}
