// src/plugins/alight-existing-document-link-plugin/alight-existing-document-link-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';

/**
 * Retrieves the selected link element from the editor.
 * If the selection is on or within a link, it returns the link element.
 * Otherwise, it returns null.
 *
 * @param editor - The CKEditor instance.
 * @returns The selected link element or null if no link is selected.
 */
export function getSelectedLinkElement(editor: Editor): Element | null {
  const view = editor.editing.view;
  const selection = view.document.selection;

  // Get the directly selected element, or if the selection is within text, get its parent.
  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  if (!selectedElement) {
    return null;
  }

  // Check if the selected element is a link
  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  // If the selection is inside a link, traverse up the tree to find the link element
  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}

/**
 * Checks if the selection has the 'alightExistingDocumentLinkPlugin' attribute.
 * This attribute is used to indicate that a public link is applied.
 *
 * @param selection - The current selection in the editor.
 * @returns True if the selection has the 'alightExistingDocumentLinkPlugin' attribute, false otherwise.
 */
export function hasLinkAttribute(selection: any): boolean {
  return selection.hasAttribute('alightExistingDocumentLinkPlugin');
}

/**
 * Retrieves the value of the 'alightExistingDocumentLinkPlugin' attribute from the selection.
 * The attribute stores link details such as the URL and an optional organization name.
 *
 * @param selection - The current selection in the editor.
 * @returns An object containing the URL and optional organization name, or undefined if not set.
 */
export function getLinkAttributeValue(selection: any): { url: string; orgName?: string } | undefined {
  const value = selection.getAttribute('alightExistingDocumentLinkPlugin');
  return value as { url: string; orgName?: string } | undefined;
}
