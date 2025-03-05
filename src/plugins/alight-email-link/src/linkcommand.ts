/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * Modified AlightEmailLinkCommand to support organization name
 */

import { Command } from 'ckeditor5/src/core';
import { findAttributeRange } from 'ckeditor5/src/typing';
import { Collection, first, toMap } from 'ckeditor5/src/utils';
import type { Range, DocumentSelection, Model, Writer } from 'ckeditor5/src/engine';

import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement } from './utils';
import type ManualDecorator from './utils/manualdecorator';

/**
 * Interface for link options including organization name
 */
interface LinkOptions {
  [key: string]: boolean | string | undefined;
  organization?: string;
}

/**
 * The link command. It is used by the {@link module:link/link~AlightEmailLink link feature}.
 * Enhanced to support organization name.
 */
export default class AlightEmailLinkCommand extends Command {
  /**
   * The value of the `'alightEmailLinkHref'` attribute if the start of the selection is located in a node with this attribute.
   *
   * @observable
   * @readonly
   */
  declare public value: string | undefined;

  /**
   * A collection of {@link module:link/utils/manualdecorator~ManualDecorator manual decorators}
   * corresponding to the {@link module:link/linkconfig~LinkConfig#decorators decorator configuration}.
   *
   * You can consider it a model with states of manual decorators added to the currently selected link.
   */
  public readonly manualDecorators = new Collection<ManualDecorator>();

  /**
   * An instance of the helper that ties together all {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition}
   * that are used by the {@glink features/link link} and the {@glink features/images/images-linking linking images} features.
   */
  public readonly automaticDecorators = new AutomaticDecorators();

  /**
   * Synchronizes the state of {@link #manualDecorators} with the currently present elements in the model.
   */
  public restoreManualDecoratorStates(): void {
    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * @inheritDoc
   */
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement() || first(selection.getSelectedBlocks());

    // A check for any integration that allows linking elements (e.g. `AlightEmailLinkImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('alightEmailLinkHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightEmailLinkHref');
    } else {
      this.value = selection.getAttribute('alightEmailLinkHref') as string | undefined;
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkHref');
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is non-collapsed, the `alightEmailLinkHref` attribute will be applied to nodes inside the selection, but only to
   * those nodes where the `alightEmailLinkHref` attribute is allowed (disallowed nodes will be omitted).
   *
   * When the selection is collapsed and is not inside the text with the `alightEmailLinkHref` attribute, a
   * new {@link module:engine/model/text~Text text node} with the `alightEmailLinkHref` attribute will be inserted in place of the caret, but
   * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
   * The selection will be updated to wrap the just inserted text node.
   *
   * When the selection is collapsed and inside the text with the `alightEmailLinkHref` attribute, the attribute value will be updated.
   *
   * @fires execute
   * @param href AlightEmailLink destination.
   * @param options Options including manual decorator attributes and organization name.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Extract organization option
    const organization = options.organization || '';

    // Extract decorator options
    const truthyManualDecorators: Array<string> = [];
    const falsyManualDecorators: Array<string> = [];

    for (const name in options) {
      if (name === 'organization') continue; // Skip organization name

      if (options[name] === true) {
        truthyManualDecorators.push(name);
      } else if (options[name] === false) {
        falsyManualDecorators.push(name);
      }
    }

    model.change(writer => {
      // If selection is collapsed then update selected link or insert new one at the place of caret.
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition()!;

        // When selection is inside text with `alightEmailLinkHref` attribute.
        if (selection.hasAttribute('alightEmailLinkHref')) {
          const linkText = extractTextFromSelection(selection);
          // Then update `alightEmailLinkHref` value.
          let linkRange = findAttributeRange(
            position,
            'alightEmailLinkHref',
            selection.getAttribute('alightEmailLinkHref'),
            model
          );

          if (selection.getAttribute('alightEmailLinkHref') === linkText) {
            linkRange = this._updateLinkContent(model, writer, linkRange, href, organization);
          } else {
            // Update the link text for organization
            this._appendOrganizationToLink(writer, linkRange, organization);
          }

          writer.setAttribute('alightEmailLinkHref', href, linkRange);

          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, linkRange);
          });

          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, linkRange);
          });

          // Put the selection at the end of the updated link.
          writer.setSelection(writer.createPositionAfter(linkRange.end.nodeBefore!));
        }
        // If not then insert text node with `alightEmailLinkHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          attributes.set('alightEmailLinkHref', href);

          truthyManualDecorators.forEach(item => {
            attributes.set(item, true);
          });

          // If organization is provided, create the display text with it
          let displayText = href;
          if (organization) {
            displayText = `${href} (${organization})`;
          }

          const { end: positionAfter } = model.insertContent(
            writer.createText(displayText, attributes as any),
            position
          );

          // Put the selection at the end of the inserted link.
          writer.setSelection(positionAfter);
        }

        // Remove the `alightEmailLinkHref` attribute and all link decorators from the selection.
        // It stops adding a new content into the link element.
        ['alightEmailLinkHref', ...truthyManualDecorators, ...falsyManualDecorators].forEach(item => {
          writer.removeSelectionAttribute(item);
        });
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        // omitting nodes where the `alightEmailLinkHref` attribute is disallowed.
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkHref');

        // But for the first, check whether the `alightEmailLinkHref` attribute is allowed on selected blocks (e.g. the "image" element).
        const allowedRanges = [];

        for (const element of selection.getSelectedBlocks()) {
          if (model.schema.checkAttribute(element, 'alightEmailLinkHref')) {
            allowedRanges.push(writer.createRangeOn(element));
          }
        }

        // Ranges that accept the `alightEmailLinkHref` attribute.
        const rangesToUpdate = allowedRanges.slice();

        // For all selection ranges we want to check whether given range is inside an element that accepts the `alightEmailLinkHref` attribute.
        for (const range of ranges) {
          if (this._isRangeToUpdate(range, allowedRanges)) {
            rangesToUpdate.push(range);
          }
        }

        for (const range of rangesToUpdate) {
          let linkRange = range;

          // Update link text if there's an organization
          if (organization) {
            this._appendOrganizationToLink(writer, linkRange, organization);
          }

          if (rangesToUpdate.length === 1) {
            // Current text of the link in the document.
            const linkText = extractTextFromSelection(selection);

            if (selection.getAttribute('alightEmailLinkHref') === linkText) {
              linkRange = this._updateLinkContent(model, writer, range, href, organization);
              writer.setSelection(writer.createSelection(linkRange));
            }
          }

          writer.setAttribute('alightEmailLinkHref', href, linkRange);

          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, linkRange);
          });

          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, linkRange);
          });
        }
      }
    });
  }

  /**
   * Updates the link text with organization name in parentheses.
   * This method uses proper Writer operations to update the text.
   */
  private _appendOrganizationToLink(writer: Writer, range: Range, organization: string): void {
    if (!organization) {
      return;
    }

    // Get the text nodes in the range
    const textNodes = Array.from(range.getItems()).filter(item => item.is('$text'));

    if (textNodes.length === 0) {
      return;
    }

    // For simplicity, get the combined text and process it
    let combinedText = '';
    for (const node of textNodes) {
      combinedText += node.data;
    }

    // Check if there's already an organization
    const match = combinedText.match(/^(.*?)(?:\s*\(([^)]*)\))?$/);
    if (!match) {
      return;
    }

    const baseText = match[1].trim(); // Trim to ensure clean spacing
    const newText = `${baseText} (${organization})`;

    // Remove all existing text nodes in the range
    for (const node of textNodes) {
      writer.remove(node);
    }

    // Insert new text with organization at the start of the range
    writer.insertText(newText, range.start);
  }

  /**
   * Provides information whether a decorator with a given name is present in the currently processed selection.
   */
  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for the `AlightEmailLinkImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }

  /**
   * Checks whether specified `range` is inside an element that accepts the `alightEmailLinkHref` attribute.
   */
  private _isRangeToUpdate(range: Range, allowedRanges: Array<Range>): boolean {
    for (const allowedRange of allowedRanges) {
      // A range is inside an element that will have the `alightEmailLinkHref` attribute. Do not modify its nodes.
      if (allowedRange.containsRange(range)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Updates the link content with href and organization if provided.
   */
  private _updateLinkContent(
    model: Model,
    writer: Writer,
    range: Range,
    href: string,
    organization: string
  ): Range {
    let text = href;

    // If organization is provided, add it to the link text
    if (organization) {
      text = `${href} (${organization})`;
    }

    // Remove all content in the range
    writer.remove(range);

    // Create a new text node with attributes
    const attributeValue = { alightEmailLinkHref: href } as any;
    const textNode = writer.createText(text, attributeValue);

    // Insert the new text node at the range start
    return model.insertContent(textNode, range.start);
  }
}

// Returns a text of a link under the collapsed selection or a selection that contains the entire link.
function extractTextFromSelection(selection: DocumentSelection): string | null {
  if (selection.isCollapsed) {
    const firstPosition = selection.getFirstPosition();

    return firstPosition!.textNode && firstPosition!.textNode.data;
  } else {
    const rangeItems = Array.from(selection.getFirstRange()!.getItems());

    if (rangeItems.length > 1) {
      return null;
    }

    const firstNode = rangeItems[0];

    if (firstNode.is('$text') || firstNode.is('$textProxy')) {
      return firstNode.data;
    }

    return null;
  }
}