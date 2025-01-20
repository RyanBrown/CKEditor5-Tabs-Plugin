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
        const locale = editor.locale;

        // Get ContextualBalloon plugin
        const balloon = editor.plugins.get('ContextualBalloon');

        // Remove any existing balloon
        if (balloon.visibleView) {
            balloon.remove(balloon.visibleView);
        }

        // Input field for media URL
        const inputView = new InputView(locale);
        inputView.set({
            placeholder: t('Enter the URL for the media'),
            id: 'media-url-input',
        });

        // Action buttons
        const acceptButtonView = new ButtonView(locale);
        acceptButtonView.set({
            label: t('Accept'),
            withText: true,
            class: 'ck-button-action',
        });

        const cancelButtonView = new ButtonView(locale);
        cancelButtonView.set({
            label: t('Cancel'),
            withText: true,
        });

        // Modal header
        const headerView = new View(locale);
        headerView.setTemplate({
            tag: 'div',
            attributes: { class: 'ck ck-form__header' },
            children: [
                {
                    tag: 'h2',
                    attributes: { class: 'ck ck-form__header__label' },
                    children: [{ text: t('Insert media') }],
                },
                {
                    tag: 'button',
                    attributes: {
                        class: 'ck ck-button',
                        type: 'button',
                    },
                    children: [{ text: t('Close') }],
                },
            ],
        });

        // Form content
        const formContent = new View(locale);
        formContent.setTemplate({
            tag: 'form',
            attributes: { class: 'ck ck-media-form ck-responsive-form' },
            children: [
                {
                    tag: 'div',
                    attributes: { class: 'ck ck-labeled-field-view' },
                    children: [inputView],
                },
            ],
        });

        // Dialog actions
        const actionsView = new View(locale);
        actionsView.setTemplate({
            tag: 'div',
            attributes: { class: 'ck ck-dialog__actions' },
            children: [cancelButtonView, acceptButtonView],
        });

        // Complete modal
        const modalView = new View(locale);
        modalView.setTemplate({
            tag: 'div',
            attributes: { class: 'ck ck-dialog ck-dialog_modal' },
            children: [headerView, formContent, actionsView],
        });

        // Accept button functionality
        acceptButtonView.on('execute', () => {
            const url = inputView.element?.value.trim();

            if (url) {
                editor.model.change((writer) => {
                    const selection = editor.model.document.selection;
                    const linkRange = selection.getFirstRange();

                    writer.setAttribute('linkHref', url, linkRange!);
                });

                balloon.remove(modalView);
            }
        });

        // Cancel button functionality
        cancelButtonView.on('execute', () => {
            balloon.remove(modalView);
        });

        // Show modal in balloon
        balloon.add({
            view: modalView,
            position: {
                target: editor.ui.getEditableElement(),
            },
        });
    }
}
