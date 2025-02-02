// src/plugins/alight-image-plugin/alight-image-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CKAlightModalDialog from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { renderContent } from './modal-content/predefined-link';

interface ImageOptionData {
  title: string;
  primaryButtonLabel?: string;
  loadContent?: () => Promise<string>;
}

export class AlightImagePluginCommand extends Command {
  private dialog: CKAlightModalDialog;
  private data: ImageOptionData;

  constructor(editor: Editor, data: ImageOptionData) {
    super(editor);
    this.data = data;

    this.dialog = new CKAlightModalDialog({
      modal: true,
      draggable: false,
      resizable: false,
      width: '80vw',
      position: 'center',
      closeOnEscape: true
    });

    // Set up the footer with action buttons
    const footerContent = document.createElement('div');
    footerContent.className = 'ck-alight-dialog-footer-buttons';

    const primaryButton = document.createElement('button');
    primaryButton.className = 'ck-button-primary';
    primaryButton.textContent = data.primaryButtonLabel || 'Continue';
    primaryButton.onclick = () => {
      console.log('Primary action for image plugin');
      this.dialog.hide();
    };

    const cancelButton = document.createElement('button');
    cancelButton.className = 'ck-button-secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
      this.dialog.hide();
    };

    footerContent.appendChild(cancelButton);
    footerContent.appendChild(primaryButton);
    this.dialog.setFooter(footerContent);
  }

  public override execute(): void {
    this.dialog.setTitle(this.data.title);

    // Create a container for the content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'modal-content-container';

    // Set initial loading state
    contentContainer.innerHTML = '<div class="loading">Loading content...</div>';
    this.dialog.setContent(contentContainer);

    this.dialog.show();

    // Load content if available
    if (this.data.loadContent) {
      this.data.loadContent().then((content) => {
        contentContainer.innerHTML = content;
        // If this is the predefined link content, initialize it
        if (this.data.title === 'Existing Image') {
          renderContent(contentContainer);
        }
      });
    }
  }

  public override destroy(): void {
    this.dialog.destroy();
    super.destroy();
  }
}