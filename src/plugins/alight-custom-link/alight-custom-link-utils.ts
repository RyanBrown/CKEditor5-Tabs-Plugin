// src/plugins/alight-custom-link/alight-custom-link-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';
import { getOptimalPosition } from '@ckeditor/ckeditor5-utils';

// Defines the shape of the balloon panel position configuration.
export interface BalloonPosition {
  target: HTMLElement | Range;
  positions?: Array<Function>;
}

// Returns positioning data so the balloon panel appears near the current selection in the editing view.
export function getBalloonPositionData(editor: Editor): BalloonPosition | undefined {
  const view = editor.editing.view;
  const viewDocument = view.document;
  const selectionRange = viewDocument.selection.getFirstRange();

  if (!selectionRange) {
    return undefined;
  }

  // Convert the view range to a native DOM range.
  const domRange = view.domConverter.viewRangeToDom(selectionRange);
  if (!(domRange instanceof Range)) {
    return undefined;
  }

  // Return the DOM Range itself as the target.
  return {
    target: domRange,
    positions: [getOptimalPosition]
  };
}
