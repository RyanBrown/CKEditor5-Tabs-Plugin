// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-utils.ts
import { DocumentSelection, Selection } from '@ckeditor/ckeditor5-engine';
import { Range } from '@ckeditor/ckeditor5-engine';

// Returns the range of the selected link, if any
export function getSelectedLinkRange(selection: Selection | DocumentSelection): Range | null {
  const range = selection.getFirstRange();
  if (!range) {
    return null;
  }

  // Check if the selection has the customHref attribute
  if (selection.hasAttribute('customHref')) {
    return range;
  }

  // Check if the range start position has customHref attribute
  const startNode = range.start.nodeAfter;
  if (startNode && 'hasAttribute' in startNode &&
    typeof startNode.hasAttribute === 'function' &&
    startNode.hasAttribute('customHref')) {
    return Range._createOn(startNode);
  }

  // Check the parent node
  const parentNode = range.start.parent;
  if (parentNode && 'hasAttribute' in parentNode &&
    typeof parentNode.hasAttribute === 'function' &&
    parentNode.hasAttribute('customHref')) {
    return Range._createOn(parentNode);
  }

  return null;
}

// Checks if the current selection contains a link
export function hasLinkAttribute(selection: Selection | DocumentSelection): boolean {
  // Check if the selection directly has the attribute
  if (selection.hasAttribute('customHref')) {
    return true;
  }

  // Check the parent node at the first position
  const node = selection.getFirstPosition()?.parent;
  if (node && 'hasAttribute' in node &&
    typeof node.hasAttribute === 'function') {
    return node.hasAttribute('customHref');
  }

  return false;
}