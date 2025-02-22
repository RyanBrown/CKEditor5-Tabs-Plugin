// src/plugins/alight-email-link-plugin/alight-email-link-plugin-command.ts


import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

export interface alightEmailLinkPluginAttributes {
  email: string;
  orgNameText?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
  declare value: alightEmailLinkPluginAttributes | undefined;

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Check if the attribute is allowed in current selection
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLink');

    // Get the current value if it exists
    this.value = selection.getAttribute('alightEmailLink') as alightEmailLinkPluginAttributes;
  }

  override execute(attributes?: alightEmailLinkPluginAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      if (!attributes) {
        // If no attributes provided, remove the existing link
        if (this.value) {
          const range = findAttributeRange(
            selection.getFirstPosition()!,
            'alightEmailLink',
            this.value,
            model
          );
          writer.removeAttribute('alightEmailLink', range);
        }
        return;
      }

      // Determine the range where we'll apply the attribute
      const range = selection.isCollapsed
        ? findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLink',
          this.value,
          model
        )
        : model.createRange(selection.getFirstPosition()!, selection.getLastPosition()!);

      // Set the email link attribute
      writer.setAttribute('alightEmailLink', attributes, range);
    });
  }
}