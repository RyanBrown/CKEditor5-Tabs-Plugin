// src/plugins/alight-email-link-plugin/alight-email-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

export interface alightEmailLinkPluginAttributes {
  email: string;
  orgName?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
  declare value: alightEmailLinkPluginAttributes | undefined;

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPlugin');
    this.value = selection.getAttribute('alightEmailLinkPlugin') as alightEmailLinkPluginAttributes;
  }

  override execute(attributes?: alightEmailLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (!attributes) {
        // Remove link
        const range = findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPlugin',
          this.value,
          model
        );
        writer.removeAttribute('alightEmailLinkPlugin', range);
        return;
      }

      // Add or update link
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