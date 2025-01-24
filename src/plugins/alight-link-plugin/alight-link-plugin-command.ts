// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import AlightDialogModalCommand from './../alight-dialog-modal/alight-dialog-modal-command';

// Defines the structure for each link option (title, how to load content, etc.)
interface LinkOptionData {
  title: string;
  content: string;
  loadContent?: () => Promise<string>;
  primaryButton?: string;
}

export default class AlightLinkPluginCommand extends AlightDialogModalCommand {
  private data: LinkOptionData;

  constructor(editor: Editor, data: LinkOptionData) {
    const { title, content, loadContent, primaryButton } = data;

    // We pass minimal "shell" content, can be updated if loadContent is async
    const modalProps = {
      title,
      content: 'Loading...',
      primaryButton: {
        label: primaryButton || 'Continue',
        onClick: () => {
          // 1) Grab URL
          const urlInput = document.getElementById('url') as HTMLInputElement | null;
          if (urlInput?.value) {
            editor.model.change((writer) => {
              writer.setSelectionAttribute('linkHref', urlInput.value);
            });
          }

          // 2) Optionally read another field
          const orgInput = document.getElementById('org-name') as HTMLInputElement | null;
          if (orgInput?.value) {
            console.log('Captured org name:', orgInput.value);
          }

          // 3) Close the modal
          this.closeModal(); // <--- we now have a protected method from AlightDialogModalCommand
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => {
          console.log('Modal dismissed');
        }
      },
      onClose: () => {
        console.log('Modal closed');
      }
    };

    super(editor, modalProps); // calls AlightDialogModalCommand constructor
    this.data = data;

    // If content is static, set it right away
    if (!loadContent) {
      this.modalProps.content = content;
      return;
    }

    // If content is async, fetch it, then store it in modalProps
    loadContent().then((html) => {
      this.modalProps.content = html;
    });
  }
}
