// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

export interface LinkAttributes {
  url: string;
  orgName?: string;
}

export default class AlightPublicLinkPluginCommand extends Command {
  declare value: LinkAttributes | undefined;

  constructor(editor: Editor) {
    super(editor);

    // Refresh the command state whenever the selection range changes
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      this.refresh();
    });
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const firstPosition = selection.getFirstPosition();

    // Check if the command should be enabled by verifying if the selection allows the attribute
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPublicLinkPlugin');

    if (!firstPosition) {
      this.value = undefined;
      return;
    }

    const attributeValue = selection.getAttribute('alightPublicLinkPlugin');
    if (attributeValue && typeof attributeValue === 'object') {
      this.value = attributeValue as LinkAttributes;
    } else {
      this.value = undefined;
    }
  }

  override execute(linkData?: LinkAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If no link data is provided, remove the link and associated organization name
      if (!linkData) {
        this._removeLink(writer);
        return;
      }

      if (selection.isCollapsed) {
        // If the selection is collapsed, find the range of the current link and update it
        const position = selection.getFirstPosition()!;
        const range = findAttributeRange(
          position,
          'alightPublicLinkPlugin',
          selection.getAttribute('alightPublicLinkPlugin'),
          model
        );
        writer.setAttribute('alightPublicLinkPlugin', linkData, range);
      } else {
        // If the selection is not collapsed, apply attributes to the selected range
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPublicLinkPlugin');

        for (const range of ranges) {
          writer.setAttribute('alightPublicLinkPlugin', linkData, range);
        }
      }
    });
  }

  private _removeLink(writer: any): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const ranges = selection.isCollapsed
      ? [findAttributeRange(
        selection.getFirstPosition()!,
        'alightPublicLinkPlugin',
        selection.getAttribute('alightPublicLinkPlugin'),
        model
      )]
      : selection.getRanges();

    // Iterate through the ranges and remove both the link attribute and any appended organization name
    for (const range of ranges) {
      writer.removeAttribute('alightPublicLinkPlugin', range);
    }
  }
}