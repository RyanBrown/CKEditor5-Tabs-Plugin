// src/plugins/alight-public-link-plugin/alight-public-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { type Range, type Item, Text } from '@ckeditor/ckeditor5-engine';

export interface LinkAttributes {
  url: string;
  orgName?: string;
}

export default class AlightPublicLinkCommand extends Command {
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

    // Check if the command should be enabled by verifying if the selection allows the attribute
    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPublicLinkPlugin');

    // Retrieve the current attribute value from the selection
    const attributeValue = selection.getAttribute('alightPublicLinkPlugin');
    if (typeof attributeValue === 'object' && attributeValue !== null) {
      this.value = attributeValue as LinkAttributes; // Store the link attributes if valid
    } else {
      this.value = undefined; // Reset the value if no valid attributes are found
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

      const { url, orgName } = linkData;
      const attributes = { url, orgName };

      if (selection.isCollapsed) {
        // If the selection is collapsed, find the range of the current link and update it
        const position = selection.getFirstPosition()!;
        const range = findAttributeRange(
          position,
          'alightPublicLinkPlugin',
          selection.getAttribute('alightPublicLinkPlugin'),
          model
        );
        writer.setAttribute('alightPublicLinkPlugin', attributes, range);
      } else {
        // If the selection is not collapsed, apply attributes to the selected range
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPublicLinkPlugin');

        for (const range of ranges) {
          // Append the organization name and set the attributes
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

    // Iterate through the ranges and remove both the link attribute and any appended organization name
    for (const range of ranges) {
      this._removeOrgName(writer, range);
      writer.removeAttribute('alightPublicLinkPlugin', range);
    }
  }

  private _appendOrgName(writer: any, range: Range, orgName?: string): void {
    if (!orgName) return; // If no organization name is provided, return early

    const endPosition = range.end; // Get the end position of the selected range
    const text = writer.createText(` (${orgName})`); // Create a text node with the org name in parentheses
    writer.insert(text, endPosition); // Insert the text at the end position
    writer.setSelection(range); // Keep the selection unchanged
  }

  private _removeOrgName(writer: any, range: Range): void {
    const value = this.value;
    if (!value?.orgName) return; // If there is no stored organization name, return early

    const orgNameSuffix = ` (${value.orgName})`; // Define the expected suffix format

    // Retrieve the text content of the range
    const text = Array.from(range.getItems())
      .filter((item): item is Text => item instanceof Text)
      .map(item => item.data)
      .join('');

    // Check if the text ends with the organization name suffix
    if (text.endsWith(orgNameSuffix)) {
      // Create positions to remove the suffix from the end of the range
      const start = writer.createPositionAt(range.end.parent, range.end.offset - orgNameSuffix.length);
      const end = writer.createPositionAt(range.end.parent, range.end.offset);
      writer.remove(writer.createRange(start, end)); // Remove the text range containing the suffix
    }
  }
}
