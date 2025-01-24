// alight-dialog-modal-command.ts
import Command from '@ckeditor/ckeditor5-core/src/command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';

import { AlightDialogModal, AlightDialogModalProps } from './alight-dialog-modal';

/**
 * A base command that:
 *  - Takes minimal, generic modal props
 *  - Creates and shows the modal
 *  - Cleans up on close
 */
export default class AlightDialogModalCommand extends Command {
  private modalProps: AlightDialogModalProps;

  constructor(editor: Editor, modalProps: AlightDialogModalProps) {
    super(editor);
    this.modalProps = modalProps;
  }

  public override execute(): void {
    const modal = new AlightDialogModal({
      ...this.modalProps,
      onClose: () => {
        console.log('Modal closed');
        if (this.modalProps.onClose) {
          this.modalProps.onClose();
        }
      },
    });
    modal.show();
  }
}
