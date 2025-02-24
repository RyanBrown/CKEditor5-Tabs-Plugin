// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts
import { Writer, Range, Element } from '@ckeditor/ckeditor5-engine';
import { Editor } from '@ckeditor/ckeditor5-core';

export function getSelectedLinkElement(editor: Editor): Element | null {
  const view = editor.editing.view;
  const selection = view.document.selection;

  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  if (!selectedElement) {
    return null;
  }

  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}

// A utility class to handle organization name operations for email links
export class OrganizationNameHandler {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  // Insert an organization name after a range (typically after an email link)
  public insertOrgName(writer: Writer, orgName: string, rangeEnd: any): void {
    if (!orgName) return;

    // Create the text for the organization name
    const orgText = ` (${orgName})`;

    // Insert the text at the range end
    writer.insertText(orgText, rangeEnd);
  }

  /**
   * Extract organization name from the text
   * @param range The range to search
   * @returns The extracted organization name, or empty string if none found
   */
  public extractOrgName(range: Range): string {
    // Since we're no longer using spans, we need a different approach to extract the org name
    // This is a simplified implementation that just looks for text in parentheses
    const text = Array.from(range.getItems())
      .filter(item => item.is('$text'))
      .map(item => item.data)
      .join('');

    // Look for text in the format " (Organization Name)"
    const match = text.match(/ \(([^)]+)\)/);
    return match ? match[1] : '';
  }
}