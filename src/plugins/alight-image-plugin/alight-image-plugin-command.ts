import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import { AlightDialogModal, AlightDialogModalProps } from './../alight-dialog-modal/alight-dialog-modal';

interface ImageOptionData {
  title: string;
  content: string;
  loadContent?: () => Promise<string>; // Optional loader for dynamic content
  primaryButton?: string;
}

export default class AlightImagePluginCommand extends Command {
  private readonly data: ImageOptionData;

  constructor(editor: Editor, data: ImageOptionData) {
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
        label: primaryButton || 'Continue',
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
