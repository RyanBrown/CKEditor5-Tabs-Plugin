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
 * The unlink command. It is used by the {@link module:link/link~AlightEmailLink link plugin}.
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
	 * This method uses proper Writer operations to update the text.
	 * 
	 * @param writer The model writer.
	 * @param range The range containing link text.
	 */
	private _removeOrganizationNameFromText(writer: Writer, range: Range): void {
		// Get all text nodes in the range
		const textNodes = Array.from(range.getItems()).filter(item => item.is('$text'));

		if (textNodes.length === 0) {
			return;
		}

		// For simplicity, get the combined text and process it
		let combinedText = '';
		for (const node of textNodes) {
			combinedText += node.data;
		}

		// Look for text with organization name pattern: "text (organization)"
		const orgPattern = /^(.*?)\s*\([^)]+\)$/;
		const match = combinedText.match(orgPattern);

		if (match) {
			// Extract the text without the organization part
			const cleanText = match[1];

			// Remove all existing text nodes in the range
			for (const node of textNodes) {
				writer.remove(node);
			}

			// Insert the clean text at the start of the range
			writer.insertText(cleanText, range.start);
		}
	}
}