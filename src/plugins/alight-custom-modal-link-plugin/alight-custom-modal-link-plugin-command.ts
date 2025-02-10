// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import CKAlightModalDialog from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContextualBalloon } from '@ckeditor/ckeditor5-ui';

export interface CommandData {
  title: string;
  modalType?: string;
  modalOptions?: {
    width?: string;
    draggable?: boolean;
    resizable?: boolean;
  };
  buttons?: Array<{
    label: string;
    className: string;
    onClick?: () => void;
  }>;
  loadContent: () => Promise<string>;
}

export class AlightCustomModalLinkPluginCommand extends Command {
  private dialog: CKAlightModalDialog;
  private data: CommandData;
  private balloon: ContextualBalloon;

  constructor(editor: any, data: CommandData) {
    super(editor);
    this.data = data;
    this.balloon = editor.plugins.get('ContextualBalloon');

    // Create dialog with correct options structure
    this.dialog = new CKAlightModalDialog({
      modal: true,
      draggable: data.modalOptions?.draggable ?? true,
      resizable: data.modalOptions?.resizable ?? false,
      width: data.modalOptions?.width || '400px',
      headerClass: 'ck-alight-modal-header',
      contentClass: 'ck-alight-modal-content',
      footerClass: 'ck-alight-modal-footer',
      buttons: data.buttons?.map(btn => ({
        label: btn.label,
        className: btn.className,
        position: 'right',
        closeOnClick: false
      })) || [],
      defaultCloseButton: true
    });

    // Set the title separately using the setTitle method
    this.dialog.setTitle(data.title);
  }

  public override execute(href?: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    if (href) {
      model.change(writer => {
        if (selection.isCollapsed) {
          const textNode = writer.createText(href, {
            customHref: href,  // Now using customHref instead of customHref
            alightCustomModalLink: true
          });
          model.insertContent(textNode, selection.getFirstPosition()!);
        } else {
          const ranges = [...selection.getRanges()];
          for (const range of ranges) {
            writer.setAttribute('customHref', href, range);
            writer.setAttribute('alightCustomModalLink', true, range);
          }
        }
      });
    } else {
      // If no href, show the modal and load content
      this.dialog.setTitle(this.data.title);
      this.data.loadContent().then(content => {
        this.dialog.setContent(content);
      });
      this.dialog.show();
    }
  }

  public override destroy(): void {
    this.dialog.destroy();
    super.destroy();
  }
}
