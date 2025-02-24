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

  /**
   * Insert an organization name after a range (typically after an email link)
   * @param writer The model writer
   * @param orgName The organization name to insert
   * @param rangeEnd The position to insert after
   */
  public insertOrgName(writer: Writer, orgName: string, rangeEnd: any): void {
    if (!orgName) return;

    const spanElement = writer.createElement('span', { class: 'org-name-text' });
    writer.insertText(` (${orgName})`, spanElement);
    writer.insert(spanElement, rangeEnd);
  }

  /**
   * Remove organization name spans from a range
   * @param writer The model writer
   * @param range The range to clean up
   */
  public removeOrgNameSpans(writer: Writer, range: Range): void {
    const items = Array.from(range.getItems());
    for (const item of items) {
      if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
        writer.remove(item);
      }
    }
  }

  /**
   * Extract organization name from spans in a range
   * @param range The range to search
   * @returns The extracted organization name, or empty string if none found
   */
  public extractOrgName(range: Range): string {
    const items = Array.from(range.getItems());
    for (const item of items) {
      if (item.is('element', 'span') && item.hasAttribute('class') && item.getAttribute('class') === 'org-name-text') {
        const firstChild = item.getChild(0);
        if (firstChild && 'data' in firstChild) {
          const spanText = firstChild.data as string;
          // Remove " (" from start and ")" from end
          return spanText.slice(2, -1);
        }
      }
    }
    return '';
  }

  // Register schema and conversion for organization name spans
  public registerSchema(): void {
    const schema = this.editor.model.schema;
    const conversion = this.editor.conversion;

    // Allow span elements in the model if not already registered
    if (!schema.isRegistered('span')) {
      schema.register('span', { allowAttributes: ['class'], allowContentOf: '$block', allowWhere: '$text' });
    }

    // Downcast conversion for spans
    conversion.for('downcast').elementToElement({
      model: 'span',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('span', {
          class: modelElement.getAttribute('class')
        });
      }
    });

    // Upcast conversion for spans with org-name-text class
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['org-name-text']
      },
      model: (viewElement, { writer }) => {
        return writer.createElement('span', { class: 'org-name-text' });
      }
    });
  }
}