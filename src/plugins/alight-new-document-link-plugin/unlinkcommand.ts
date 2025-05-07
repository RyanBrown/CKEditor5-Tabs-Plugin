// src/plugins/alight-new-document-link-plugin/unlinkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import type AlightNewDocumentLinkPluginCommand from './linkcommand';
import { isLinkableElement } from './utils';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightNewDocumentLinkPlugin link feature}.
 */
export default class AlightNewDocumentUnlinkCommand extends Command {
  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for any integration that allows linking elements (e.g. `AlightNewDocumentLinkPluginImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightNewDocumentLinkPluginHref');
    } else {
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightNewDocumentLinkPluginHref');
    }
  }

  /**
    * Executes the command.
    *
    * When the selection is collapsed, it removes the `alightNewDocumentLinkPluginHref` attribute from each node with the same `alightNewDocumentLinkPluginHref` attribute value.
    * When the selection is non-collapsed, it removes the `alightNewDocumentLinkPluginHref` attribute from each node in selected ranges.
    */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightNewDocumentLinkPluginHref',
          selection.getAttribute('alightNewDocumentLinkPluginHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightNewDocumentLinkPluginHref');

      // Remove `alightNewDocumentLinkPluginHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        writer.removeAttribute('alightNewDocumentLinkPluginHref', range);

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
