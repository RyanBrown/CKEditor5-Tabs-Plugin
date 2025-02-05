// src/plugins/alight-image-plugin/alight-image-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CKAlightModalDialog from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { renderContent } from './modal-content/existing-image';

interface DialogButton {
  label: string;
  className: string;
  onClick?: () => void;
}

interface CommandData {
  title: string;
  modalType?: 'existingImage' | 'uploadImage';
  modalOptions?: {
    modal?: boolean;
    draggable?: boolean;
    resizable?: boolean;
    width?: string;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    closeOnEscape?: boolean;
    headerClass?: string;
    contentClass?: string;
    footerClass?: string;
  };
  buttons?: DialogButton[];
  loadContent: () => Promise<string>;
}

export class AlightImagePluginCommand extends Command {
  private dialog: CKAlightModalDialog;
  private data: CommandData;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;
    this.dialog = new CKAlightModalDialog({
      modal: true,
      draggable: false,
      resizable: false,
      width: '600px',
      position: 'center',
      closeOnEscape: true,
      ...data.modalOptions
    });

    this.setupDialogButtons();
  }

  private setupDialogButtons(): void {
    if (!this.data.buttons?.length) {
      const footer = document.createElement('div');
      footer.className = 'cka-dialog-footer-buttons';

      const defaultButton = document.createElement('button');
      defaultButton.className = 'cka-button cka-button-rounded';
      defaultButton.textContent = 'Close';
      defaultButton.onclick = () => this.dialog.hide();

      footer.appendChild(defaultButton);
      this.dialog.setFooter(footer);
      return;
    }

    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    this.data.buttons.forEach(button => {
      const btnElement = document.createElement('button');
      btnElement.className = button.className;
      btnElement.textContent = button.label;
      btnElement.onclick = () => {
        button.onClick?.();
        this.dialog.hide();
      };
      footer.appendChild(btnElement);
    });

    this.dialog.setFooter(footer);
  }

  public override execute(): void {
    this.dialog.setTitle(this.data.title);
    this.data.loadContent().then(content => {
      this.dialog.setContent(content);

      if (this.data.modalType === 'existingImage') {
        const contentEl = this.dialog.getContentElement();
        if (contentEl) {
          renderContent(contentEl);
        }
      }
    });
    this.dialog.show();
  }

  public override destroy(): void {
    this.dialog.destroy();
    super.destroy();
  }
}