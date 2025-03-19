// src/plugins/alight-email-link-plugin/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type { Range, DocumentSelection, Model, Writer } from '@ckeditor/ckeditor5-engine';

import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement, isEmail, ensureMailtoLink } from './utils';
import type ManualDecorator from './utils/manualdecorator';

/**
 * Interface for link options including organization name
 */
interface LinkOptions {
  [key: string]: boolean | string | undefined;
  organization?: string;
}

/**
 * The link command. It is used by the {@link module:link/link~AlightEmailLinkPlugin link feature}.
 * Enhanced to support organization name.
 */
export default class AlightEmailLinkPluginCommand extends Command {
  /**
   * The value of the `'alightEmailLinkPluginHref'` attribute if the start of the selection is located in a node with this attribute.
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

    // A check for any integration that allows linking elements (e.g. `AlightEmailLinkPluginImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('alightEmailLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightEmailLinkPluginHref');
    } else {
      this.value = selection.getAttribute('alightEmailLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPluginHref');
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is non-collapsed, the `alightEmailLinkPluginHref` attribute will be applied to nodes inside the selection, but only to
   * those nodes where the `alightEmailLinkPluginHref` attribute is allowed (disallowed nodes will be omitted).
   *
   * When the selection is collapsed and is not inside the text with the `alightEmailLinkPluginHref` attribute, a
   * new {@link module:engine/model/text~Text text node} with the `alightEmailLinkPluginHref` attribute will be inserted in place of the caret, but
   * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
   * The selection will be updated to wrap the just inserted text node.
   *
   * When the selection is collapsed and inside the text with the `alightEmailLinkPluginHref` attribute, the attribute value will be updated.
   *
   * @fires execute
   * @param href Email link destination.
   * @param options Options including manual decorator attributes and organization name.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    // Always ensure this is a mailto link
    href = ensureMailtoLink(href);

    const model = this.editor.model;
    const selection = model.document.selection;

    // Extract organization option - explicitly handle empty string for organization removal
    const organization = options.organization !== undefined ? options.organization : '';

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

        // When selection is inside text with `alightEmailLinkPluginHref` attribute.
        if (selection.hasAttribute('alightEmailLinkPluginHref')) {
          // Get the link range
          const linkRange = findAttributeRange(
            position,
            'alightEmailLinkPluginHref',
            selection.getAttribute('alightEmailLinkPluginHref'),
            model
          );

          // Update the link href attribute
          writer.setAttribute('alightEmailLinkPluginHref', href, linkRange);

          // Apply manual decorator attributes
          for (const decorator of truthyManualDecorators) {
            writer.setAttribute(decorator, true, linkRange);
          }

          for (const decorator of falsyManualDecorators) {
            writer.removeAttribute(decorator, linkRange);
          }

          // Handle organization name update if needed
          if (organization !== undefined) {
            this._updateOrganizationName(writer, linkRange, organization, href);
          }

          // Position selection at the end of the link
          writer.setSelection(linkRange.end);
        }
        // If not then insert text node with `alightEmailLinkPluginHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());
          attributes.set('alightEmailLinkPluginHref', href);

          // Add manual decorator attributes
          for (const decorator of truthyManualDecorators) {
            attributes.set(decorator, true);
          }

          // Create display text with organization if provided
          let displayText = href.startsWith('mailto:') ? href.substring(7) : href;
          if (organization) {
            displayText = `${displayText} (${organization})`;
          }

          const { end: positionAfter } = model.insertContent(
            writer.createText(displayText, attributes as any),
            position
          );

          // Put the selection at the end of the inserted link.
          writer.setSelection(positionAfter);
        }

        // Remove the `alightEmailLinkPluginHref` attribute and all link decorators from the selection.
        // It stops adding a new content into the link element.
        ['alightEmailLinkPluginHref', ...truthyManualDecorators, ...falsyManualDecorators].forEach(item => {
          writer.removeSelectionAttribute(item);
        });
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        // while preserving all other formatting attributes
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkPluginHref');

        // First, apply the link attribute to all ranges
        for (const range of ranges) {
          // Apply the link attribute
          writer.setAttribute('alightEmailLinkPluginHref', href, range);

          // Apply manual decorator attributes
          for (const decorator of truthyManualDecorators) {
            writer.setAttribute(decorator, true, range);
          }

          for (const decorator of falsyManualDecorators) {
            writer.removeAttribute(decorator, range);
          }
        }

        // Handle organization name if provided
        if (organization !== undefined) {
          for (const range of ranges) {
            this._updateOrganizationName(writer, range, organization, href);
          }
        }
      }
    });
  }

  /**
   * Updates the organization name in a text range.
   * This preserves all formatting attributes while updating the text.
   *
   * @param writer The model writer.
   * @param range The range to update.
   * @param organization The organization name to set (empty string to remove).
   * @param href The href value to set.
   * @private
   */
  private _updateOrganizationName(writer: Writer, range: Range, organization: string, href: string): void {
    // Collect all text items in the range
    const textItems = Array.from(range.getItems()).filter(item =>
      item.is('$text') || item.is('$textProxy')
    );

    if (!textItems.length) {
      return;
    }

    // Combine all text to extract the base content without organization
    let fullText = '';
    for (const item of textItems) {
      fullText += item.data;
    }

    // Extract the base text without any organization part
    const orgPattern = /^(.*?)(?:\s*\([^)]+\))?$/;
    const match = fullText.match(orgPattern);
    const baseText = match ? match[1].trim() : fullText;

    // Create the new text with or without organization
    let newText = baseText;
    if (organization) {
      newText = `${baseText} (${organization})`;
    }

    // If text doesn't need to change, just return
    if (fullText === newText) {
      return;
    }

    // Create a map to store all attributes from all text nodes
    // This ensures we preserve ALL formatting (bold, italic, etc.)
    const firstTextNode = textItems[0];
    if (!firstTextNode) {
      return;
    }

    // Store all attributes from the first text node
    const attributes = new Map();
    for (const [key, value] of firstTextNode.getAttributes()) {
      attributes.set(key, value);
    }

    // Ensure the link attribute is set properly
    attributes.set('alightEmailLinkPluginHref', href);

    // Remove existing content
    writer.remove(range);

    // Insert the new text with all preserved attributes
    writer.insert(writer.createText(newText, attributes), range.start);
  }

  /**
   * Provides information whether a decorator with a given name is present in the currently processed selection.
   */
  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for the `AlightEmailLinkPluginImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }
}
