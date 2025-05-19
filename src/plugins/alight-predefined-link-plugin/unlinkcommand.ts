// src/plugins/alight-predefined-link-plugin/unlinkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import type AlightPredefinedLinkPluginCommand from './linkcommand';
import { isLinkableElement } from './utils';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightPredefinedLinkPlugin link feature}.
 */
export default class AlightPredefinedLinkPluginUnlinkCommand extends Command {
  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for any integration that allows linking elements (e.g. `AlightPredefinedLinkPluginImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightPredefinedLinkPluginHref');
    } else {
      // Check for both collapsed and non-collapsed selections
      if (selection.isCollapsed) {
        // For collapsed selection, check if cursor is inside link
        this.isEnabled = selection.hasAttribute('alightPredefinedLinkPluginHref');
      } else {
        // For non-collapsed selection, check if attribute can be applied to selection
        this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref');
      }
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the `alightPredefinedLinkPluginHref` attribute from each node with the same `alightPredefinedLinkPluginHref` attribute value.
   * When the selection is non-collapsed, it removes the `alightPredefinedLinkPluginHref` attribute from each node in selected ranges.
   * This implementation also removes additional attributes used by predefined links.
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightPredefinedLinkPluginHref',
          selection.getAttribute('alightPredefinedLinkPluginHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');

      // Remove all predefined link attributes from specified ranges.
      for (const range of rangesToUnlink) {
        if (linkCommand && typeof linkCommand.removeAllLinkAttributes === 'function') {
          // Use the helper method if available
          linkCommand.removeAllLinkAttributes(writer, range);
        } else {
          // Fallback implementation if helper method is not available
          // Remove the main link attribute
          writer.removeAttribute('alightPredefinedLinkPluginHref', range);

          // Remove additional predefined link attributes
          writer.removeAttribute('alightPredefinedLinkPluginFormat', range);
          writer.removeAttribute('alightPredefinedLinkPluginLinkName', range);
          writer.removeAttribute('linkHref', range);

          // If there are registered custom attributes, then remove them during unlink.
          if (linkCommand) {
            for (const manualDecorator of linkCommand.manualDecorators) {
              writer.removeAttribute(manualDecorator.id, range);
            }
          }
        }
      }
      // Remove any link-related attributes that might remain
      const additionalLinkAttrs = [
        'linkIsExternal',
        'linkIsDownloadable',
        'linkTarget',
        'linkRel'
      ];

      for (const range of rangesToUnlink) {
        for (const attr of additionalLinkAttrs) {
          writer.removeAttribute(attr, range);
        }
      }
    });
  }
}
