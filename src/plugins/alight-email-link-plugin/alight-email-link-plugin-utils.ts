// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';

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