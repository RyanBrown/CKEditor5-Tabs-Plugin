// src/plugins/alight-population-plugin/alight-population-plugin-command.ts
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import Command from '@ckeditor/ckeditor5-core/src/command';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type { ArrayOrItem } from '@ckeditor/ckeditor5-utils';

interface DialogButton {
  label: string;
  className: string;
  onClick?: () => void;
}

interface CommandData {
  title: string;
  modalType?: 'systemPopulations';
  modalOptions?: {
    modal?: boolean;
    draggable?: boolean;
    resizable?: boolean;
    width?: string;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    closeOnEscape?: boolean;
  };
  buttons?: DialogButton[];
  loadContent: () => Promise<string>;
}

interface SystemPopulationsCommandParam {
  file: ArrayOrItem<File>;
}

export class AlightPopulationPluginCommand extends Command {
  private dialog: CkAlightModalDialog;
  private data: CommandData;
  public readonly isAccessAllowed: boolean = true;

  constructor(editor: Editor, data: CommandData) {
    super(editor);
    this.data = data;
    this.dialog = new CkAlightModalDialog({
      modal: true,
      draggable: false,
      resizable: false,
      width: '600px',
      position: 'center',
      ...data.modalOptions
    });

    this.setupDialogButtons();
  }

  protected async _systemPopulations(file: File): Promise<void> {
    // Add your population upload logic here
    console.log('Population:', file);
  }

  private setupDialogButtons(): void {
    if (!this.data.buttons?.length) {
      const footer = document.createElement('div');
      footer.className = 'cka-dialog-footer-buttons';

      const defaultButton = document.createElement('button');
      defaultButton.className = 'cka-button cka-button-rounded cka-button-sm';
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

  public override execute(options: SystemPopulationsCommandParam): void {
    if (!this.isAccessAllowed) {
      return;
    }

    this.dialog.setTitle(this.data.title);

    this.data.loadContent().then(content => {
      this.dialog.setContent(content);
    });

    this.dialog.show();
  }

  public override destroy(): void {
    this.dialog.destroy();
    super.destroy();
  }
}