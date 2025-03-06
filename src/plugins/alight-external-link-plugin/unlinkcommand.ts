/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightExternalLinkUnlinkCommand
 */

import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

import type AlightExternalLinkCommand from './linkcommand';
import { isLinkableElement } from './utils';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightExternalLink link plugin}.
 */
export default class AlightExternalLinkUnlinkCommand extends Command {
  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for any integration that allows linking elements (e.g. `AlightExternalLinkImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightExternalLinkHref');
    } else {
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightExternalLinkHref');
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the `alightExternalLinkHref` attribute from each node with the same `alightExternalLinkHref` attribute value.
   * When the selection is non-collapsed, it removes the `alightExternalLinkHref` attribute from each node in selected ranges.
   *
   * # Decorators
   *
   * If {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} is specified,
   * all configured decorators are removed together with the `alightExternalLinkHref` attribute.
   *
   * @fires execute
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightExternalLinkHref',
          selection.getAttribute('alightExternalLinkHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightExternalLinkHref');

      // Remove `alightExternalLinkHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        writer.removeAttribute('alightExternalLinkHref', range);
        // If there are registered custom attributes, then remove them during unlink.
        if (linkCommand) {
          for (const manualDecorator of linkCommand.manualDecorators) {
            writer.removeAttribute(manualDecorator.id, range);
          }
        }
      }
    });
  }
}