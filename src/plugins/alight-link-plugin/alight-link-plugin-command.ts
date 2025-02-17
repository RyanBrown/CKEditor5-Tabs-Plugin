// src/plugins/alight-link-plugin/alight-link-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ILinkManager } from './modal-content/ILinkManager';
import { CommandData, DialogButton } from './modal-content/types';

export class AlightLinkPluginCommand extends Command {
  protected dialog: CkAlightModalDialog;
  protected data: CommandData;
  protected manager?: ILinkManager;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;
    this.manager = data.manager;

    this.dialog = new CkAlightModalDialog({
      width: '600px', // set the custom modal width
      ...data.modalOptions
    });

    this.setupDialogButtons();
  }

  private setupDialogButtons(): void {
    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    if (!this.data.buttons?.length) {
      const defaultButtons: DialogButton[] = [
        {
          label: 'Close',
          className: 'cka-button cka-button-rounded cka-button-sm',
          variant: 'outlined',
          position: 'left'
        }
      ];
      this.setupDefaultButtons(footer, defaultButtons);
    } else if (this.data.modalType === 'predefinedLink' || this.data.modalType === 'existingDocumentLink') {
      this.setupLinkButtons(footer);
    } else {
      this.setupDefaultButtons(footer, this.data.buttons);
    }

    this.dialog.setFooter(footer);
  }

  private setupDefaultButtons(footer: HTMLDivElement, buttons: DialogButton[]): void {
    buttons.forEach(button => {
      const btnElement = document.createElement('button');
      btnElement.setAttribute('type', 'button');
      if (button.className) {
        btnElement.className = button.className;
      }
      btnElement.textContent = button.label || '';
      btnElement.onclick = () => {
        if (this.manager?.getSelectedLink) {
          const selectedLink = this.manager.getSelectedLink();
          if (selectedLink && 'destination' in selectedLink) {
            this.insertLink(selectedLink.destination);
          }
        }
        button.onClick?.();
        this.dialog.hide();
      };
      footer.appendChild(btnElement);
    });
  }

  private setupLinkButtons(footer: HTMLDivElement): void {
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cka-button cka-button-rounded cka-button-outlined cka-button-sm';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
      if (this.manager) {
        this.manager.resetSearch?.();
      }
      this.dialog.hide();
    };
    footer.appendChild(cancelButton);

    // Continue button
    const continueButton = document.createElement('button');
    continueButton.className = 'cka-button cka-button-rounded cka-button-sm';
    continueButton.textContent = 'Continue';
    continueButton.onclick = () => {
      const selectedLink = this.manager?.getSelectedLink?.();
      if (selectedLink && 'destination' in selectedLink) {
        this.insertLink(selectedLink.destination);
      }
      this.dialog.hide();
    };
    footer.appendChild(continueButton);
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
