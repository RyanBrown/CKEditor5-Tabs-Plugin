import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import { AlightDialogModal } from '../alight-dialog-modal/alight-dialog-modal';

interface LinkOptionData {
  title: string;
  content: string;
  loadContent?: () => Promise<string>;
  primaryButton?: string;
}

export default class AlightLinkPluginCommand extends Command {
  private readonly data: LinkOptionData;
  private modal: AlightDialogModal | null = null;

  constructor(editor: Editor, data: LinkOptionData) {
    super(editor);
    this.data = data;
  }

  public override async execute(): Promise<void> {
    const { title, content, loadContent, primaryButton } = this.data;
    const editor = this.editor;

    // Load dynamic content if provided
    const resolvedContent = loadContent ? await loadContent() : content;

    this.modal = new AlightDialogModal({
      title,
      content: resolvedContent,
      primaryButton: {
        label: primaryButton || 'Continue',
        onClick: () => {
          const urlInput = document.getElementById('url') as HTMLInputElement | null;
          if (urlInput && urlInput.value) {
            editor.model.change(writer => {
              // Use 2-argument form
              writer.setSelectionAttribute('linkHref', urlInput.value);
            });
          }

          const orgInput = document.getElementById('org-name') as HTMLInputElement | null;
          if (orgInput) {
            console.log('Captured org name:', orgInput.value);
          }

          this.modal?.closeModal();
        },
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => {
          console.log('Modal dismissed');
        },
      },
      onClose: () => {
        console.log('Modal closed');
      },
    });

    this.modal.show();

    console.log('Executing command with dynamic content:', {
      title,
      resolvedContent,
      primaryButton,
    });
  }
}
