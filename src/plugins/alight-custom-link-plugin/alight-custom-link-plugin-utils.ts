// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin-utils.ts

/**
 * alight - custom - link - plugin - utils.ts
  *
 * Helpers for retrieving the current link range or other link - related logic.
 */

import { DocumentSelection, Selection } from '@ckeditor/ckeditor5-engine';
import { Range } from '@ckeditor/ckeditor5-engine';

export function getSelectedLinkRange(selection: Selection | DocumentSelection): Range | null {
  // Return the first range if it exists; otherwise null
  const range = selection.getFirstRange();
  return range || null;
}
