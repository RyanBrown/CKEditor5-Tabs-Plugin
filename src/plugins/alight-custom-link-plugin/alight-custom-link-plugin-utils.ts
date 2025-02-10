// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin-utils.ts

/**
 * alight-custom-link-plugin-utils.ts
 *
 * Helpers for retrieving the current link range or other link-related logic.
 */

import { DocumentSelection, Selection } from '@ckeditor/ckeditor5-engine';
import { Range } from '@ckeditor/ckeditor5-engine';

// Returns the range of the selected link, if any
export function getSelectedLinkRange(selection: Selection | DocumentSelection): Range | null {
  const range = selection.getFirstRange();
  if (!range) {
    return null;
  }

  // Check if the range has a linkHref attribute
  const node = range.start.nodeAfter;
  if (node && 'hasAttribute' in node && typeof node.hasAttribute === 'function') {
    if (node.hasAttribute('linkHref')) {
      return range;
    }
  }

  // Also check if the range start position has linkHref attribute
  if (selection.getAttribute('linkHref')) {
    return range;
  }

  // If we get here, no link was found in the selection
  return null;
}

// Checks if the current selection contains a link
export function hasLinkAttribute(selection: Selection | DocumentSelection): boolean {
  const node = selection.getFirstPosition()?.parent;
  return !!(node && 'hasAttribute' in node &&
    typeof node.hasAttribute === 'function' &&
    node.hasAttribute('linkHref'));
}