// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CKAlightModalDialog from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { PredefinedLinkManager } from './modal-content/predefined-link';

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

  /**
   * Function that returns an HTML string to load into the dialog.
   * (e.g. from `PredefinedLinkManager.getPredefinedLinkContent()`)
   */
  loadContent: () => Promise<string>;

  /**
   * If this command needs to handle advanced rendering/behavior
   * (e.g. attaching events, advanced search), include a reference
   * to the manager.
   */
  manager?: PredefinedLinkManager;
}

export class AlightLinkPluginCommand extends Command {
  private dialog: CKAlightModalDialog;
  private data: CommandData;

  /**
   * If we need to render events or do advanced logic,
   * we'll store a reference to the PredefinedLinkManager.
   */
  private manager?: PredefinedLinkManager;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;

    // Store the manager if provided
    this.manager = data.manager;

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
    // Set the dialog title
    this.dialog.setTitle(this.data.title);

    // Load content (returns a Promise<string>)
    this.data.loadContent().then(content => {
      // Insert the HTML into the modal
      this.dialog.setContent(content);

      // If it's the "predefinedLink" type, we might need to attach
      // event listeners, advanced filtering, etc. via the manager
      if (this.data.modalType === 'predefinedLink' && this.manager) {
        const contentEl = this.dialog.getContentElement();
        if (contentEl) {
          // This will wire up checkboxes, pagination, etc.
          this.manager.renderContent(contentEl);
        }
      }
    });

    // Finally, show the dialog
    this.dialog.show();
  }

  public override destroy(): void {
    this.dialog.destroy();
    super.destroy();
  }
}
