// src/plugins/alight-dialog-modal/alight-dialog-command.ts
import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';
import { AlightDialogModal, AlightDialogModalProps } from './alight-dialog-modal';

export default class AlightDialogModalCommand extends Command {
  // protected so subclasses can modify
  protected modalProps: AlightDialogModalProps;
  protected modal: AlightDialogModal | null = null;

  constructor(editor: Editor, modalProps: AlightDialogModalProps) {
    super(editor);
    this.modalProps = modalProps;
  }

  public override execute(): void {
    this.modal = new AlightDialogModal({
      ...this.modalProps,
      onClose: () => {
        this.modalProps.onClose?.();
      }
    });

    this.modal.show();
  }

  // Let subclasses close the modal
  protected closeModal(): void {
    if (this.modal) {
      this.modal.closeModal(this.modalProps.onClose);
      this.modal = null;
    }
  }
}
