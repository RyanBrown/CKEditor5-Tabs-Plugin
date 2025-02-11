// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-utils.ts
import { DocumentSelection, Selection } from '@ckeditor/ckeditor5-engine';
import { Range, Position } from '@ckeditor/ckeditor5-engine';

// Gets the range of the selected link (if any).
// The key fix is to EXPAND the range in both directions
// to cover all text nodes that have the 'customHref' attribute.
export function getSelectedLinkRange(selection: Selection | DocumentSelection): Range | null {
  // If there's no link attribute in the selection, bail out
  const href = selection.getAttribute('customHref');
  if (!href) {
    return null;
  }

  // Get the first range in the selection
  const firstRange = selection.getFirstRange();
  if (!firstRange) {
    return null;
  }

  // We'll expand from its start/end positions as long as adjacent nodes have 'customHref'.
  let start = firstRange.start;
  let end = firstRange.end;

  // Move backward while the nodeBefore has 'customHref'
  while (start.nodeBefore && 'hasAttribute' in start.nodeBefore && start.nodeBefore.hasAttribute('customHref')) {
    start = new Position(start.root, start.path.slice());
    start = start.getShiftedBy(-1);
  }

  // Move forward while the nodeAfter has 'customHref'
  while (end.nodeAfter && 'hasAttribute' in end.nodeAfter && end.nodeAfter.hasAttribute('customHref')) {
    end = new Position(end.root, end.path.slice());
    end = end.getShiftedBy(1);
  }

  return new Range(start, end);
}

// Returns `true` if the selection has the 'customHref' attribute (i.e., is within a link).
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
