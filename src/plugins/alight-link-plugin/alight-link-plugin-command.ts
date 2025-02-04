// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import CKAlightModalDialog from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ILinkManager } from './modal-content/ILinkManager';
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
  loadContent: () => Promise<string>;
  manager?: ILinkManager;
}

export class AlightLinkPluginCommand extends Command {
  protected dialog: CKAlightModalDialog;
  protected data: CommandData;
  protected manager?: ILinkManager;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;
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
    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    if (!this.data.buttons?.length) {
      // If no buttons provided, create a simple Close button
      const defaultButton = document.createElement('button');
      defaultButton.className = 'cka-button cka-button-rounded';
      defaultButton.textContent = 'Close';
      defaultButton.onclick = () => this.dialog.hide();
      footer.appendChild(defaultButton);
      this.dialog.setFooter(footer);
      return;
    }

    // Create custom buttons based on modal type
    if (this.data.modalType === 'predefinedLink') {
      this.setupPredefinedLinkButtons(footer);
    } else {
      // Handle other modal types
      this.setupDefaultButtons(footer);
    }

    this.dialog.setFooter(footer);
  }

  private setupPredefinedLinkButtons(footer: HTMLDivElement): void {
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cka-button cka-button-rounded cka-button-outlined';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
      this.dialog.hide();
    };
    footer.appendChild(cancelButton);

    // Continue button
    const continueButton = document.createElement('button');
    continueButton.className = 'cka-button cka-button-rounded';
    continueButton.textContent = 'Continue';
    continueButton.onclick = () => {
      const predefinedManager = this.manager as PredefinedLinkManager;
      const selectedLink = predefinedManager?.getSelectedLink();

      if (selectedLink) {
        this.insertLink(selectedLink.destination);
      }

      this.dialog.hide();
    };
    footer.appendChild(continueButton);
  }

  private setupDefaultButtons(footer: HTMLDivElement): void {
    this.data.buttons?.forEach(button => {
      const btnElement = document.createElement('button');
      btnElement.className = button.className;
      btnElement.textContent = button.label;
      btnElement.onclick = () => {
        button.onClick?.();
        this.dialog.hide();
      };
      footer.appendChild(btnElement);
    });
  }

  private insertLink(destination: string): void {
    const selection = this.editor.model.document.selection;

    this.editor.model.change(writer => {
      if (selection.isCollapsed) {
        // If no text is selected, insert a new "Link" text with the link attribute
        const position = selection.getFirstPosition();
        if (!position) return;

        const attributes = {
          linkHref: destination,
          linkTarget: '_blank'
        };
        const text = writer.createText('Link', attributes);
        writer.insert(text, position);
      } else {
        // If text is selected, apply the link attributes to the selection
        const range = selection.getFirstRange();
        if (!range) return;

        writer.setAttributes(
          {
            linkHref: destination,
            linkTarget: '_blank'
          },
          range
        );
      }
    });
  }

  public override execute(): void {
    this.dialog.setTitle(this.data.title);

    // Load content and handle manager setup
    this.data.loadContent().then(content => {
      this.dialog.setContent(content);

      // If we have a manager, let it handle advanced logic
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
