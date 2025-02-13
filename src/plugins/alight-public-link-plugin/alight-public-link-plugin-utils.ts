// src/plugins/alight-public-link-plugin/alight-public-link-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { type Element } from '@ckeditor/ckeditor5-engine';

export function getSelectedLinkElement(editor: Editor): Element | null {
  const view = editor.editing.view;
  const selection = view.document.selection;

  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  if (!selectedElement) {
    return null;
  }

  // Check if the selected element is a link
  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  // If the selection is inside a link, walk up the tree to find the link element
  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}

export function hasLinkAttribute(selection: any): boolean {
  return selection.hasAttribute('alightPublicLinkPlugin');
}

export function getLinkAttributeValue(selection: any): { url: string; orgName?: string } | undefined {
  const value = selection.getAttribute('alightPublicLinkPlugin');
  return value as { url: string; orgName?: string } | undefined;
}