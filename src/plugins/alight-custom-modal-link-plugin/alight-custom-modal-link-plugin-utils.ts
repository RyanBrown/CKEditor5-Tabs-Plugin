// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-utils.ts
import { DocumentSelection, Selection } from '@ckeditor/ckeditor5-engine';
import { Range } from '@ckeditor/ckeditor5-engine';

/**
 * Gets the range of the selected link (if any).
 * We look for 'customHref' in the selection or in the node after the start.
 */
export function getSelectedLinkRange(selection: Selection | DocumentSelection): Range | null {
  const range = selection.getFirstRange();
  if (!range) {
    return null;
  }

  // If the selection has the attribute, return its range
  if (selection.hasAttribute('customHref')) {
    return range;
  }

  // For a collapsed selection, check both nodeBefore and nodeAfter
  if (range.isCollapsed) {
    const pos = range.start;
    const nodeBefore = pos.nodeBefore;
    const nodeAfter = pos.nodeAfter;

    // Check nodeBefore if it exists
    if (
      nodeBefore &&
      'hasAttribute' in nodeBefore &&
      nodeBefore.hasAttribute('customHref')
    ) {
      return Range._createOn(nodeBefore);
    }

    // If not found, check nodeAfter
    if (
      nodeAfter &&
      'hasAttribute' in nodeAfter &&
      nodeAfter.hasAttribute('customHref')
    ) {
      return Range._createOn(nodeAfter);
    }
  }

  // Existing code:
  const startNode = range.start.nodeAfter;
  if (
    startNode &&
    'hasAttribute' in startNode &&
    startNode.hasAttribute('customHref')
  ) {
    return Range._createOn(startNode);
  }

  const parentNode = range.start.parent;
  if (
    parentNode &&
    'hasAttribute' in parentNode &&
    parentNode.hasAttribute('customHref')
  ) {
    return Range._createOn(parentNode);
  }

  return null;
}


// Returns true if the selection has the 'customHref' attribute (i.e., on a link).
export function hasLinkAttribute(selection: Selection | DocumentSelection): boolean {
  // Check if the selection directly has the attribute
  if (selection.hasAttribute('customHref')) {
    return true;
  }

  // Check the parent node at the first position
  const node = selection.getFirstPosition()?.parent;
  if (node && 'hasAttribute' in node && typeof node.hasAttribute === 'function') {
    return node.hasAttribute('customHref');
  }

  return false;
}
