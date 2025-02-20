// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts
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
