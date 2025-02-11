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

    // Create dialog with the given options
    this.dialog = new CKAlightModalDialog({
      modal: true,
      draggable: data.modalOptions?.draggable ?? true,
      resizable: data.modalOptions?.resizable ?? false,
      width: data.modalOptions?.width || '400px',
      headerClass: 'ck-alight-modal-header',
      contentClass: 'ck-alight-modal-content',
      footerClass: 'ck-alight-modal-footer',
      buttons:
        data.buttons?.map((btn) => ({
          label: btn.label,
          className: btn.className,
          position: 'right',
          closeOnClick: false
        })) || [],
      defaultCloseButton: true
    });

    // Set the dialog title
    this.dialog.setTitle(data.title);
  }

  // Executes the link command.
  // If `href` is provided, it applies the `customHref` attribute to the selection (or inserts a text node).
  // If `href` is not provided, it shows the modal and loads its content.
  public override execute(href?: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // If an href is supplied, we link the selection
    if (href) {
      model.change((writer) => {
        if (selection.isCollapsed) {
          // Insert new text node with link
          const textNode = writer.createText(href, {
            customHref: href,
            alightCustomModalLink: true
          });
          model.insertContent(textNode, selection.getFirstPosition()!);
        } else {
          // Apply link attributes to the selected range
          const ranges = [...selection.getRanges()];
          for (const range of ranges) {
            writer.setAttribute('customHref', href, range);
            writer.setAttribute('alightCustomModalLink', true, range);
          }
        }
      });
    } else {
      // No href => show the modal UI and load the content
      this.dialog.setTitle(this.data.title);
      this.data.loadContent().then((content) => {
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
