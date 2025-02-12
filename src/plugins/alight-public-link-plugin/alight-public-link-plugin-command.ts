// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { type Range } from '@ckeditor/ckeditor5-engine';

export default class AlightPublicLinkCommand extends Command {
  declare value: string | undefined;

  constructor(editor: Editor) {
    super(editor);

    // Refresh command state when selection changes
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      this.refresh();
    });
  }

  refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Command is enabled only when there's text selection
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPublicLinkPlugin');

    // Set current value based on selection
    if (selection.hasAttribute('alightPublicLinkPlugin')) {
      this.value = selection.getAttribute('alightPublicLinkPlugin');
    } else {
      this.value = undefined;
    }
  }

  execute(href?: string): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If no href provided, remove the link
      if (!href) {
        writer.removeSelectionAttribute('alightPublicLinkPlugin');
        return;
      }

      // Get the range where we'll apply the link
      const ranges = selection.isCollapsed
        ? [findAttributeRange(
          selection.getFirstPosition()!,
          'alightPublicLinkPlugin',
          selection.getAttribute('alightPublicLinkPlugin'),
          model
        )]
        : model.schema.getValidRanges(selection.getRanges(), 'alightPublicLinkPlugin');

      // Apply link to all valid ranges
      for (const range of ranges) {
        writer.setAttribute('alightPublicLinkPlugin', href, range);
      }
    });
  }
}