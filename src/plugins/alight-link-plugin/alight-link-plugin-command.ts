// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import AlightDialogModalCommand from './../alight-dialog-modal/alight-dialog-modal-command';

/**
 * Defines the structure for each link option (title, how to load content, etc.)
 */
export interface LinkOptionData {
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
    const modalProps: AlightDialogModalProps = {
      title,
      content: 'Loading...', // Initial placeholder
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
          this.closeModal(); // Correct: no arguments
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => {
          console.log('Modal dismissed');
          this.closeModal(); // Correct: no arguments
        }
      },
      onClose: () => {
        console.log('Modal closed');
      }
    };

    super(editor, modalProps);
    this.data = data;

    // Handle asynchronous content loading
    if (loadContent) {
      loadContent()
        .then((html) => {
          if (this.modal) {
            this.modal.updateContent(html);
          }
        })
        .catch((error) => {
          console.error('Error loading modal content:', error);
          if (this.modal) {
            this.modal.updateContent('<p>Error loading content. Please try again later.</p>');
          }
        });
    } else {
      this.modalProps.content = content;
      if (this.modal) {
        this.modal.updateContent(content); // Ensure content is updated if modal exists
      }
    }
  }
}
