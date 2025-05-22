// src/plugins/alight-predefined-link-plugin/unlinkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import type { Element, Node as ModelNode } from '@ckeditor/ckeditor5-engine';
import type AlightPredefinedLinkPluginCommand from './linkcommand';
import { isLinkableElement } from './utils';
import { isModelElementWithName } from './utils';

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
      // Check if we're currently selecting an ahLinkWrapper element
      if (selectedElement && isModelElementWithName(selectedElement, 'ahLinkWrapper')) {
        this.isEnabled = true;
        return;
      }

      // Check for standard attribute-based links
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref');
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is collapsed, it removes the `alightPredefinedLinkPluginHref` attribute from each node with the same `alightPredefinedLinkPluginHref` attribute value.
   * When the selection is non-collapsed, it removes the `alightPredefinedLinkPluginHref` attribute from each node in selected ranges.
   * Also handles custom ahLinkWrapper elements.
   */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand | undefined;

    model.change(writer => {
      // Check if we're dealing with a custom link element
      const selectedElement = selection.getSelectedElement();

      if (selectedElement && isModelElementWithName(selectedElement, 'ahLinkWrapper')) {
        // For element-based links, we need to remove the entire element
        // Extract the text content to preserve it
        let textContent = '';

        // Find the ahLink element
        const ahLinkElement = Array.from(selectedElement.getChildren())
          .find(child => isModelElementWithName(child, 'ahLink'));

        if (ahLinkElement) {
          // Extract text from ahLink
          textContent = Array.from(ahLinkElement.getChildren())
            .filter(item => item.is('$text'))
            .map(item => (item as any).data)
            .join('');
        }

        // Replace the element with its text content
        model.insertContent(
          writer.createText(textContent || ''),
          selectedElement,
          'before'
        );

        // Remove the element
        writer.remove(selectedElement);
        return;
      }

      // For attribute-based links, follow standard procedure
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightPredefinedLinkPluginHref',
          selection.getAttribute('alightPredefinedLinkPluginHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');

      // Remove `alightPredefinedLinkPluginHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        writer.removeAttribute('alightPredefinedLinkPluginHref', range);

        // Also remove related attributes
        writer.removeAttribute('alightPredefinedLinkPluginLinkName', range);
        writer.removeAttribute('alightPredefinedLinkPluginFormat', range);

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
