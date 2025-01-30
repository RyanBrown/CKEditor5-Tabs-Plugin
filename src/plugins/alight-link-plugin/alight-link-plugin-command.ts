// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import AlightDialogModalCommand from './../alight-dialog-modal/alight-dialog-modal-command';
import { AlightDialogModalProps } from './../alight-dialog-modal/alight-dialog-modal';
import { renderContent } from './modal-content/predefined-link';

// Defines the structure for each link option (title, how to load content, etc.)
export interface LinkOptionData {
  title: string;
  content: string;
  loadContent?: () => Promise<string>;
  primaryButton?: string;
  contentClass?: string;
}

export default class AlightLinkPluginCommand extends AlightDialogModalCommand {
  private data: LinkOptionData;

  constructor(editor: Editor, data: LinkOptionData) {
    const { title, primaryButton, contentClass } = data;

    // Initialize modal properties with an empty content; content will be rendered later
    const modalProps: AlightDialogModalProps = {
      title,
      content: '', // Will be set after content is rendered
      primaryButton: {
        label: primaryButton || 'Continue',
        onClick: () => {
          // Handle primary button click if needed
          const selectedRadio = document.querySelector('input[name="link-selection"]:checked') as HTMLInputElement | null;
          if (selectedRadio) {
            const selectedLinkName = selectedRadio.value;
            console.log('Selected Link:', selectedLinkName);
            // Implement logic to apply the selected link
            // e.g., editor.model.change(...);
          }
          this.closeModal();
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => {
          console.log('Modal dismissed');
          this.closeModal();
        }
      },
      onClose: () => {
        console.log('Modal closed');
      },
      contentClass: contentClass || '',
      onContentReady: () => {
        console.log('Content is ready and scripts have been executed.');
        // Place any additional code you want to run after content is ready here
      }
    };

    super(editor, modalProps);
    this.data = data;
  }

  public override execute(): void {
    // Initialize and show the modal
    super.execute();

    if (this.modal) {
      // Get the modal's content container using the getter
      const modalContentContainer = this.modal.contentContainerElement;
      console.log('Modal Content Container:', modalContentContainer);

      // Render the initial content (first page) and attach event listeners
      renderContent(modalContentContainer);

      // Inject any arbitrary code here
      // Example: Dynamically adding a script
      const arbitraryScript = document.createElement('script');
      arbitraryScript.textContent = `
        console.log('Arbitrary script is running inside the modal.');
        // Add more custom JavaScript as needed
        const customButton = document.createElement('button');
        customButton.textContent = 'Custom Action';
        customButton.id = 'custom-action-button';
        customButton.style.marginTop = '10px';
        customButton.onclick = () => alert('Custom Action Executed!');
        document.body.appendChild(customButton);
      `;
      modalContentContainer.appendChild(arbitraryScript);
    }
  }
}
