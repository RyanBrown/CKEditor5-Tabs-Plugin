// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';

// Retrieves the selected link element from the editor.
// If the selection is on or within a link, it returns the link element.
// Otherwise, it returns null.
// @param editor - The CKEditor instance.
// @returns The selected link element or null if no link is selected.
export function getSelectedLinkElement(editor: Editor): Element | null {
  // Get the view from the editor editing instance.
  const view = editor.editing.view;
  // Retrieve the current selection from the view's document.
  const selection = view.document.selection;

  // Get the directly selected element or, if selection is within text, get its parent element.
  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  // If no element is selected, return null.
  if (!selectedElement) {
    return null;
  }

  // Check if the selected element is a link (<a> element).
  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  // If the selection is inside a link, traverse up the parent chain to find the link element.
  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}
