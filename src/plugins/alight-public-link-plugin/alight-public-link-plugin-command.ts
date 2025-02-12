// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { type Range } from '@ckeditor/ckeditor5-engine';

interface LinkAttributes {
  url: string;
  orgName?: string;
}

export default class AlightPublicLinkCommand extends Command {
  declare value: LinkAttributes | undefined;

  constructor(editor: Editor) {
    super(editor);

    // Refresh command state when selection changes
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      this.refresh();
    });
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Command is enabled only when there's text selection
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPublicLinkPlugin');

    // Set current value based on selection
    const attributeValue = selection.getAttribute('alightPublicLinkPlugin');
    if (typeof attributeValue === 'object' && attributeValue !== null) {
      this.value = attributeValue as LinkAttributes;
    } else {
      this.value = undefined;
    }
  }

  override execute(linkData?: { url: string; orgName?: string }): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If no link data provided, remove the link and org name
      if (!linkData) {
        this._removeLink(writer);
        return;
      }

      const { url, orgName } = linkData;
      const attributes = { url, orgName };

      if (selection.isCollapsed) {
        const position = selection.getFirstPosition()!;
        const range = findAttributeRange(
          position,
          'alightPublicLinkPlugin',
          selection.getAttribute('alightPublicLinkPlugin'),
          model
        );
        writer.setAttribute('alightPublicLinkPlugin', attributes, range);
      } else {
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPublicLinkPlugin');

        // For each valid range, append org name and set attributes
        for (const range of ranges) {
          this._appendOrgName(writer, range, orgName);
          writer.setAttribute('alightPublicLinkPlugin', attributes, range);
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

    // Remove both the link attribute and any appended org name
    for (const range of ranges) {
      this._removeOrgName(writer, range);
      writer.removeAttribute('alightPublicLinkPlugin', range);
    }
  }

  private _appendOrgName(writer: any, range: Range, orgName?: string): void {
    if (!orgName) return;

    const endPosition = range.end;
    const text = writer.createText(` (${orgName})`);
    writer.insert(text, endPosition);
    writer.setSelection(range);
  }

  private _removeOrgName(writer: any, range: Range): void {
    const value = this.value;
    if (!value?.orgName) return;

    const orgNameSuffix = ` (${value.orgName})`;
    const text = Array.from(range.getItems()).map(item => item.data).join('');

    if (text.endsWith(orgNameSuffix)) {
      const start = writer.createPositionAt(range.end.parent, range.end.offset - orgNameSuffix.length);
      const end = writer.createPositionAt(range.end.parent, range.end.offset);
      writer.remove(writer.createRange(start, end));
    }
  }
}