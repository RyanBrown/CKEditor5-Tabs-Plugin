// src/plugins/alight-email-link-plugin/alight-email-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

export interface AlightEmailLinkPluginAttributes {
  email: string;
  orgName?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
  declare value: AlightEmailLinkPluginAttributes | undefined;

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPlugin');
    this.value = selection.getAttribute('alightEmailLinkPlugin') as AlightEmailLinkPluginAttributes;
  }

  override execute(attributes?: AlightEmailLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (!attributes) {
        const range = findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPlugin',
          this.value,
          model
        );
        writer.removeAttribute('alightEmailLinkPlugin', range);
        return;
      }

      const range = selection.isCollapsed
        ? findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPlugin',
          this.value,
          model
        )
        : model.createRange(selection.getFirstPosition()!, selection.getLastPosition()!);

      writer.setAttribute('alightEmailLinkPlugin', attributes, range);
    });
  }
}
