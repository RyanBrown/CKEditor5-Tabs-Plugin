import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import { ReusableModal, ModalProps } from './reusable-modal';

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

        // Use ReusableModal to display the modal
        const modal = new ReusableModal({
            title,
            content,
            primaryButton: {
                label: primaryButton || 'Accept',
                onClick: () => this.handlePrimaryAction(content),
            },
            tertiaryButton: {
                label: 'Cancel',
                onClick: () => console.log('Modal dismissed'),
            },
            onClose: () => console.log('Modal closed'),
        });

        modal.show(); // Assuming `ReusableModal` has a `show()` method
        console.log('Executing command with:', { title, content, primaryButton });
    }

    private handlePrimaryAction(content: string): void {
        const editor = this.editor;
        const input = document.querySelector('#link-url-input') as HTMLInputElement;
        const url = input?.value.trim();

        if (url) {
            editor.model.change((writer) => {
                const selection = editor.model.document.selection;
                const range = selection.getFirstRange();

                writer.setAttribute('linkHref', url, range!);
            });
            console.log('URL applied:', url);
        }
    }
}
