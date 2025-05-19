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
      // Check for both our custom and standard link attributes
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightPredefinedLinkPluginHref') ||
        model.schema.checkAttribute(selectedElement, 'linkHref');
    } else {
      // For collapsed selections, check if we're inside a link
      if (selection.isCollapsed) {
        // Enable if cursor is inside a link with either our custom attribute or standard linkHref
        this.isEnabled = selection.hasAttribute('alightPredefinedLinkPluginHref') ||
          selection.hasAttribute('linkHref');
      } else {
        // For non-collapsed selections, check if attribute can be applied to selection
        this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref') ||
          model.schema.checkAttributeInSelection(selection, 'linkHref');
      }
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the link attributes from each node with the same attribute values.
   * When the selection is non-collapsed, it removes the link attributes from each node in selected ranges.
   * This implementation also handles both our custom attributes and standard link attributes.
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand | undefined;

    model.change(writer => {
      // Collect all ranges to unlink based on both custom and standard link attributes
      let rangesToUnlink = [];

      if (selection.isCollapsed) {
        // For collapsed selection, try to find ranges with either type of link attribute
        if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
          rangesToUnlink.push(
            findAttributeRange(
              selection.getFirstPosition()!,
              'alightPredefinedLinkPluginHref',
              selection.getAttribute('alightPredefinedLinkPluginHref'),
              model
            )
          );
        } else if (selection.hasAttribute('linkHref')) {
          rangesToUnlink.push(
            findAttributeRange(
              selection.getFirstPosition()!,
              'linkHref',
              selection.getAttribute('linkHref'),
              model
            )
          );
        }
      } else {
        // For non-collapsed selections, get valid ranges for both attributes
        const alightRanges = model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');
        const standardRanges = model.schema.getValidRanges(selection.getRanges(), 'linkHref');

        rangesToUnlink = [...alightRanges, ...standardRanges];
      }

      // Skip if no ranges found (safety check)
      if (!rangesToUnlink.length) {
        console.warn('No link ranges found to unlink');
        return;
      }

      // Process each range to remove all link attributes
      for (const range of rangesToUnlink) {
        if (!range) continue; // Skip null ranges

        if (linkCommand && typeof linkCommand.removeAllLinkAttributes === 'function') {
          // Use the helper method if available
          linkCommand.removeAllLinkAttributes(writer, range);
        } else {
          // Fallback implementation to remove all link-related attributes
          this._removeAllLinkAttributes(writer, range);
        }
      }
    });
  }

  /**
   * Helper method to remove all link-related attributes from a range.
   * This is a fallback in case the linkCommand's method is not available.
   * 
   * @param writer The model writer
   * @param range The range to remove attributes from
   */
  private _removeAllLinkAttributes(writer: any, range: any): void {
    // Remove both our custom attributes and standard link attributes
    const attributesToRemove = [
      // Our custom attributes
      'alightPredefinedLinkPluginHref',
      'alightPredefinedLinkPluginFormat',
      'alightPredefinedLinkPluginLinkName',

      // Standard link attributes
      'linkHref',
      'linkIsExternal',
      'linkIsDownloadable',
      'linkTarget',
      'linkRel'
    ];

    // Remove each attribute from the range
    for (const attr of attributesToRemove) {
      writer.removeAttribute(attr, range);
    }

    // Attempt to find and remove any other link-related attributes
    const model = this.editor.model;
    const selection = model.document.selection;
    const firstPosition = selection.getFirstPosition();

    if (firstPosition) {
      const item = firstPosition.textNode || firstPosition.nodeBefore;

      if (item) {
        try {
          for (const [key] of item.getAttributes()) {
            // Remove any attribute that includes "link" in its name
            if (typeof key === 'string' && (key.startsWith('link') || key.includes('link'))) {
              writer.removeAttribute(key, range);
            }
          }
        } catch (error) {
          console.error('Error while removing additional link attributes:', error);
        }
      }
    }
  }
}
