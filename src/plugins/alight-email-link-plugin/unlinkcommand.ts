// src/plugins/alight-email-link-plugin/unlinkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';

import type AlightEmailLinkPluginCommand from './linkcommand';
import { isLinkableElement } from './utils';
import type { Range, Writer } from '@ckeditor/ckeditor5-engine';

/**
 * The unlink command. It is used by the {@link module:link/link~AlightEmailLinkPlugin link feature}.
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

    // A check for any integration that allows linking elements (e.g. `AlightEmailLinkPluginImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightEmailLinkPluginHref');
    } else {
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPluginHref');
    }
  }

  /**
    * Executes the command.
    *
    * When the selection is collapsed, it removes the `alightEmailLinkPluginHref` attribute from each node with the same `alightEmailLinkPluginHref` attribute value.
    * When the selection is non-collapsed, it removes the `alightEmailLinkPluginHref` attribute from each node in selected ranges.
    * Additionally, it removes organization names from the text content.
    */
  public override execute(): void {
    const editor = this.editor;
    const model = this.editor.model;
    const selection = model.document.selection;
    const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand | undefined;

    model.change(writer => {
      // Get ranges to unlink.
      const rangesToUnlink = selection.isCollapsed ?
        [findAttributeRange(
          selection.getFirstPosition()!,
          'alightEmailLinkPluginHref',
          selection.getAttribute('alightEmailLinkPluginHref'),
          model
        )] :
        model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkPluginHref');

      // Remove `alightEmailLinkPluginHref` attribute from specified ranges.
      for (const range of rangesToUnlink) {
        // Before removing the attribute, let's remove any organization name from the text
        this._removeOrganizationNameFromText(writer, range);

        writer.removeAttribute('alightEmailLinkPluginHref', range);

        // Also remove the organization name attribute
        writer.removeAttribute('alightEmailLinkPluginOrgName', range);

        // If there are registered custom attributes, then remove them during unlink.
        if (linkCommand) {
          // Clear the organization property in the command
          linkCommand.organization = undefined;

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
    const textNodes = Array.from(range.getItems()).filter(item =>
      item.is('$text') || item.is('$textProxy')
    );

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

      // If we only have one text node, we can simply update its data
      if (textNodes.length === 1) {
        const node = textNodes[0];
        // Create a new node with the same attributes but updated text
        const attrs: Record<string, unknown> = {};
        for (const [key, value] of node.getAttributes()) {
          if (key !== 'alightEmailLinkPluginHref') {
            attrs[key] = value;
          }
        }

        // Remove the old node and insert the new one
        writer.remove(node);
        writer.insert(writer.createText(baseText, attrs), range.start);
      } else {
        // We need to handle multiple text nodes
        // First, find out where the org part starts
        const orgStartPos = baseText.length;

        // Track accumulated length
        let currentPos = 0;
        const textsToKeep: Array<{ text: string, node: any }> = [];

        // Go through all text nodes and keep only the parts before the org name
        for (const node of textNodes) {
          const nodeStart = currentPos;
          const nodeEnd = currentPos + node.data.length;

          // If this node ends before the org part starts, keep it all
          if (nodeEnd <= orgStartPos) {
            textsToKeep.push({
              text: node.data,
              node: node
            });
          }
          // If this node contains the start of the org part, keep only the part before
          else if (nodeStart < orgStartPos) {
            const textToKeep = node.data.substring(0, orgStartPos - nodeStart);
            if (textToKeep.length > 0) {
              textsToKeep.push({
                text: textToKeep,
                node: node
              });
            }
          }
          // Otherwise this node is part of the org, skip it

          currentPos = nodeEnd;
        }

        // Remove all nodes
        for (const node of textNodes) {
          writer.remove(node);
        }

        // Insert the parts we want to keep
        let insertPos = range.start;
        for (const text of textsToKeep) {
          // Get attributes from the original node
          const attrs: Record<string, unknown> = {};
          for (const [key, value] of text.node.getAttributes()) {
            if (key !== 'alightEmailLinkPluginHref') {
              attrs[key] = value;
            }
          }

          // Create and insert the new node
          const newNode = writer.createText(text.text, attrs);
          writer.insert(newNode, insertPos);
          insertPos = insertPos.getShiftedBy(text.text.length);
        }
      }
    }
  }
}
