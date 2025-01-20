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

        // Get the ContextualBalloon plugin
        const balloon = editor.plugins.get('ContextualBalloon');

        // Check if a balloon is already visible and remove it
        if (balloon.visibleView) {
            balloon.remove(balloon.visibleView);
        }

        // Create input and button views
        const inputView = new InputView(locale);
        inputView.set({
            placeholder: t('Enter the URL for the link'),
        });

        const submitButtonView = new ButtonView(locale);
        submitButtonView.set({
            label: t('Insert Link'),
            withText: true,
            tooltip: true,
        });

        const cancelButtonView = new ButtonView(locale);
        cancelButtonView.set({
            label: t('Cancel'),
            withText: true,
            tooltip: true,
        });

        // Create a form view to hold the input and buttons
        const formView = new View(locale);
        formView.setTemplate({
            tag: 'form',
            attributes: {
                class: 'ck ck-link-form',
            },
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: 'ck ck-link-form__row',
                    },
                    children: [inputView],
                },
                {
                    tag: 'div',
                    attributes: {
                        class: 'ck ck-link-form__actions',
                    },
                    children: [submitButtonView, cancelButtonView],
                },
            ],
        });

        // Add behavior to buttons
        submitButtonView.on('execute', () => {
            const url = inputView.element!.value;

            if (url) {
                editor.model.change((writer) => {
                    const selection = editor.model.document.selection;
                    const linkRange = selection.getFirstRange();

                    writer.setAttribute('linkHref', url, linkRange!);
                });

                balloon.remove(formView); // Remove the balloon after inserting the link
            }
        });

        cancelButtonView.on('execute', () => {
            balloon.remove(formView); // Close the balloon on cancel
        });

        // Ensure we position the dialog properly relative to the editor
        const targetElement = editor.ui.getEditableElement();

        if (targetElement) {
            balloon.add({
                view: formView,
                position: {
                    target: targetElement, // Attach to the editable area
                },
            });
        } else {
            console.warn('Could not find the editable element.');
        }
    }
}
