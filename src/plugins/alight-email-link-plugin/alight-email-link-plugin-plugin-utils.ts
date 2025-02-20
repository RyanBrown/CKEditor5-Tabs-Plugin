// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts

// Import types for Editor and Element from CKEditor packages.
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';

// Retrieves the selected link element from the editor.
// If the selection is on or within a link, it returns the link element.
// Otherwise, it returns null.
// @param editor - The CKEditor instance.
// @returns The selected link element or null if no link is selected.

export function getSelectedLinkElement(editor: Editor): Element | null {
  // console.log('[getSelectedLinkElement] Retrieving the editing view and selection from the editor.');
  // Get the view from the editor editing instance.
  const view = editor.editing.view;
  // Retrieve the current selection from the view's document.
  const selection = view.document.selection;
  // console.log('[getSelectedLinkElement] Current selection:', selection);

  // Get the directly selected element or, if selection is within text, get its parent element.
  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;
  // console.log('[getSelectedLinkElement] Determined selected element:', selectedElement);

  // If no element is selected, return null.
  if (!selectedElement) {
    // console.log('[getSelectedLinkElement] No selected element found. Returning null.');
    return null;
  }

  // Check if the selected element is a link (<a> element).
  if (selectedElement.is('element', 'a')) {
    // console.log('[getSelectedLinkElement] Selected element is a link (<a>). Returning this element.');
    return selectedElement as unknown as Element;
  }

  // If the selection is inside a link, traverse up the parent chain to find the link element.
  let parent = selectedElement.parent;
  while (parent) {
    // console.log('[getSelectedLinkElement] Checking parent element:', parent);
    if (parent.is('element', 'a')) {
      // console.log('[getSelectedLinkElement] Found parent element that is a link (<a>). Returning this element.');
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  // If no link element is found in the ancestry, return null.
  // console.log('[getSelectedLinkElement] No link element found in the selection ancestry. Returning null.');
  return null;
}
