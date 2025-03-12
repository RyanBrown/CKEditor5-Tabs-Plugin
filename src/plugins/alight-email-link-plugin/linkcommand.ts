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

          // First, collect the current link text without organization name
          let baseText = '';
          const textNodes = Array.from(linkRange.getItems()).filter(item => item.is('$text') || item.is('$textProxy'));

          for (const node of textNodes) {
            baseText += node.data;
          }

          // Remove organization part if present
          const orgPattern = /^(.*?)(?:\s*\([^)]+\))?$/;
          const match = baseText.match(orgPattern);

          if (match) {
            baseText = match[1].trim();
          }

          // Create new text with or without organization
          let newText = baseText;
          if (organization) {
            newText = `${baseText} (${organization})`;
          }

          // Remove all existing content first
          writer.remove(linkRange);

          // Insert new content with proper attribute
          const attributes = { alightEmailLinkPluginHref: href } as any;

          // Add decorators
          truthyManualDecorators.forEach(item => {
            attributes[item] = true;
          });

          const newTextNode = writer.createText(newText, attributes);
          model.insertContent(newTextNode, linkRange.start);

          // Put the selection at the end of the updated link
          writer.setSelection(writer.createPositionAt(linkRange.start.parent, linkRange.start.offset + newText.length));
        }
        // If not then insert text node with `alightEmailLinkPluginHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          attributes.set('alightEmailLinkPluginHref', href);

          truthyManualDecorators.forEach(item => {
            attributes.set(item, true);
          });

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
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkPluginHref');

        // Get the selected text content without any organization parts
        let selectedText = '';

        // Extract just the base text without organizations
        for (const range of selection.getRanges()) {
          for (const item of range.getItems()) {
            if (item.is('$text') || item.is('$textProxy')) {
              selectedText += item.data;
            }
          }
        }

        // Remove existing organization name if present
        const orgPattern = /^(.*?)(?:\s*\([^)]+\))?$/;
        const match = selectedText.match(orgPattern);

        if (match) {
          selectedText = match[1].trim(); // Use only the text without organization
        }

        // Create the new text with the new organization if provided
        let finalText = selectedText;
        if (organization) {
          finalText = `${selectedText} (${organization})`;
        }

        // Process each range
        for (const range of ranges) {
          // First, remove the old content
          writer.remove(range);

          // Then insert the new content with the organization
          const attributes = { alightEmailLinkPluginHref: href } as any;

          // Add decorators
          truthyManualDecorators.forEach(item => {
            attributes[item] = true;
          });

          // Insert the new content
          const newText = writer.createText(finalText, attributes);
          model.insertContent(newText, range.start);
        }
      }
    });
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
