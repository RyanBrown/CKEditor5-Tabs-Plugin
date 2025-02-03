// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CKAlightModalDialog from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ILinkManager } from './modal-content/ILinkManager';

interface DialogButton {
  label: string;
  className: string;
  onClick?: () => void;
}

interface CommandData {
  title: string;
  modalType?: 'predefinedLink' | 'publicWebsiteLink' | 'intranetLink' | 'existingDocumentLink' | 'newDocumentLink';
  modalOptions?: {
    modal?: boolean;
    draggable?: boolean;
    resizable?: boolean;
    width?: string;
    position?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
    closeOnEscape?: boolean;
  };
  buttons?: DialogButton[];

  // A function that returns HTML for the dialog content.
  loadContent: () => Promise<string>;

  /**
   * The optional manager can handle advanced behavior (pagination, filters).
   * Both PredefinedLinkManager and ExistingDocumentLinkManager 
   * implement the ILinkManager interface.
   */
  manager?: ILinkManager;
}

export class AlightLinkPluginCommand extends Command {
  private dialog: CKAlightModalDialog;
  private data: CommandData;

  // Manager typed as ILinkManager or undefined.
  private manager?: ILinkManager;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;
    this.manager = data.manager; // store reference if provided

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
    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    if (!this.data.buttons?.length) {
      // If no buttons provided, create a simple Close
      const defaultButton = document.createElement('button');
      defaultButton.className = 'cka-button cka-button-rounded';
      defaultButton.textContent = 'Close';
      defaultButton.onclick = () => this.dialog.hide();
      footer.appendChild(defaultButton);
      this.dialog.setFooter(footer);
      return;
    }

    // Otherwise, create the provided buttons
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

    // loadContent returns a Promise<string>
    this.data.loadContent().then(content => {
      this.dialog.setContent(content);

      // If we have a manager, let it handle advanced logic (renderContent)
      if (this.manager) {
        const contentEl = this.dialog.getContentElement();
        if (contentEl) {
          this.manager.renderContent(contentEl);
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
