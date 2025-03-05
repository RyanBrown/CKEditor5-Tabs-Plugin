/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * Modified UnlinkCommand to handle organization name removal
 */
import { Command } from 'ckeditor5/src/core';
import { findAttributeRange } from 'ckeditor5/src/typing';

import type AlightEmailLinkCommand from './linkcommand';
import { isLinkableElement } from './utils';
import type { Range, Writer } from '@ckeditor/ckeditor5-engine';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightEmailLink link feature}.
 * Enhanced to remove organization names from links.
 */
export default class AlightEmailUnlinkCommand extends Command {
  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for any integration that allows linking elements (e.g. `AlightEmailLinkImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightEmailLinkHref');
    } else {
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkHref');
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the `alightEmailLinkHref` attribute from each node with the same `alightEmailLinkHref` attribute value.
   * When the selection is non-collapsed, it removes the `alightEmailLinkHref` attribute from each node in selected ranges.
   * Additionally, it removes organization names from the text content.
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkHref',
          selection.getAttribute('alightEmailLinkHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkHref');

      // Remove `alightEmailLinkHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        // Before removing the attribute, let's remove any organization name from the text
        this._removeOrganizationNameFromText(writer, range);

        writer.removeAttribute('alightEmailLinkHref', range);

        // If there are registered custom attributes, then remove them during unlink.
        if (linkCommand) {
          for (const manualDecorator of linkCommand.manualDecorators) {
            writer.removeAttribute(manualDecorator.id, range);
          }
        }
      }
    });
  }

  /**
   * Removes organization name from text in the given range.
   * Specifically looks for text ending with " (Organization Name)" and removes that part.
   * 
   * @param writer The model writer.
   * @param range The range containing link text.
   */
  private _removeOrganizationNameFromText(writer: Writer, range: Range): void {
    // Get all text in the range as an array of nodes
    const textNodes = Array.from(range.getItems()).filter(item => item.is('$text') || item.is('$textProxy'));

    if (textNodes.length === 0) {
      return;
    }

    // Combine all text into a single string
    let fullText = '';
    for (const node of textNodes) {
      fullText += node.data;
    }

    // Look specifically for text ending with " (Something)" pattern
    const orgPattern = /^(.*?)[ ]+\([^)]+\)$/;
    const match = fullText.match(orgPattern);

    if (match) {
      // Get the base text without the organization name
      const baseText = match[1];

      try {
        // Remove all existing text nodes
        for (const node of textNodes) {
          writer.remove(node);
        }

        // Insert just the base text without organization name
        writer.insertText(baseText, range.start);
      } catch (error) {
        console.error('Error removing organization name from link:', error);
      }
    }
  }
}