import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import { AlightDialogModal, AlightDialogModalProps } from '../alight-dialog-modal/alight-dialog-modal';

interface LinkOptionData {
    title: string;
    content: string;
    loadContent?: () => Promise<string>; // Optional loader for dynamic content
    primaryButton?: string;
}

export default class AlightLinkPluginCommand extends Command {
    private readonly data: LinkOptionData;

    constructor(editor: Editor, data: LinkOptionData) {
        super(editor);
        this.data = data;
    }

    override async execute(): Promise<void> {
        const { title, content, loadContent, primaryButton } = this.data;

        // Load dynamic content if `loadContent` is provided
        const resolvedContent = loadContent ? await loadContent() : content;

        const modal = new AlightDialogModal({
            title,
            content: resolvedContent,
            primaryButton: {
                label: primaryButton || 'Insert',
                onClick: () => console.log('Primary action clicked'),
            },
            tertiaryButton: {
                label: 'Cancel',
                onClick: () => console.log('Modal dismissed'),
            },
            onClose: () => console.log('Modal closed'),
        });

        modal.show();
        console.log('Executing command with dynamic content:', { title, resolvedContent, primaryButton });
    }
}
