// src/plugins/alight-existing-document-link/unlinkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

import type AlightExistingDocumentLinkPluginCommand from './linkcommand';
import { isLinkableElement } from './utils';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightExistingDocumentLinkPlugin link feature}.
 */
export default class AlightExistingDocumentLinkPluginUnlinkCommand extends Command {
  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for any integration that allows linking elements (e.g. `AlightExistingDocumentLinkPluginImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'AlightExistingDocumentLinkPluginHref');
    } else {
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'AlightExistingDocumentLinkPluginHref');
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the `AlightExistingDocumentLinkPluginHref` attribute from each node with the same `AlightExistingDocumentLinkPluginHref` attribute value.
   * When the selection is non-collapsed, it removes the `AlightExistingDocumentLinkPluginHref` attribute from each node in selected ranges.
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'AlightExistingDocumentLinkPluginHref',
          selection.getAttribute('AlightExistingDocumentLinkPluginHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'AlightExistingDocumentLinkPluginHref');

      // Remove `AlightExistingDocumentLinkPluginHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        writer.removeAttribute('AlightExistingDocumentLinkPluginHref', range);

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
