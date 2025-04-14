// src/plugins/alight-predefined-link-plugin/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type { Range, DocumentSelection, Model, Writer } from '@ckeditor/ckeditor5-engine';

import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement, isPredefinedLink, extractPredefinedLinkId } from './utils';
import type ManualDecorator from './utils/manualdecorator';

/**
 * Interface for link options
 */
interface LinkOptions {
  [key: string]: boolean | string | undefined;
}

/**
 * The link command. It is used by the {@link module:link/link~AlightPredefinedLinkPlugin link feature}.
 */
export default class AlightPredefinedLinkPluginCommand extends Command {
  /**
   * The value of the `'alightPredefinedLinkPluginHref'` attribute if the start of the selection is located in a node with this attribute.
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
   * Fires an event with the specified name and data.
   * 
   * @param eventName The name of the event to fire
   * @param data Additional data to pass with the event
   */
  private _fireEvent(eventName: string, data: any = {}): void {
    this.fire(eventName, data);
  }

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

    // A check for any integration that allows linking elements (e.g. `AlightPredefinedLinkPluginImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('alightPredefinedLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightPredefinedLinkPluginHref');
    } else {
      this.value = selection.getAttribute('alightPredefinedLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref');
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is non-collapsed, the `alightPredefinedLinkPluginHref` attribute will be applied to nodes inside the selection, but only to
   * those nodes where the `alightPredefinedLinkPluginHref` attribute is allowed (disallowed nodes will be omitted).
   *
   * When the selection is collapsed and is not inside the text with the `alightPredefinedLinkPluginHref` attribute, a
   * new {@link module:engine/model/text~Text text node} with the `alightPredefinedLinkPluginHref` attribute will be inserted in place of the caret, but
   * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
   * The selection will be updated to wrap the just inserted text node.
   *
   * When the selection is collapsed and inside the text with the `alightPredefinedLinkPluginHref` attribute, the attribute value will be updated.
   *
   * @fires execute
   * @param href AlightPredefinedLinkPlugin destination.
   * @param options Options including manual decorator attributes.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    // Determine if href is a predefined link ID
    const isPredefined = isPredefinedLink(href);

    // Get the format attribute from the current selection if it exists
    let linkFormat = '';
    let linkName = '';

    const model = this.editor.model;
    const selection = model.document.selection;

    // Check if the current link has a predefined format we need to preserve
    if (selection.hasAttribute('alightPredefinedLinkPluginFormat')) {
      linkFormat = selection.getAttribute('alightPredefinedLinkPluginFormat') as string;
    }

    // Check if the current link has a link name attribute we need to preserve
    if (selection.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      linkName = selection.getAttribute('alightPredefinedLinkPluginLinkName') as string;
    }

    // Make sure predefined links have the suffix
    if (isPredefined && !href.includes('~predefined_editor_id')) {
      href = href + '~predefined_editor_id';
    }

    // Extract decorator options
    const truthyManualDecorators: Array<string> = [];
    const falsyManualDecorators: Array<string> = [];

    for (const name in options) {
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

        // When selection is inside text with `alightPredefinedLinkPluginHref` attribute.
        if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
          // Get the link range
          const linkRange = findAttributeRange(
            position,
            'alightPredefinedLinkPluginHref',
            selection.getAttribute('alightPredefinedLinkPluginHref'),
            model
          );

          // Update the existing link with the new href
          writer.setAttribute('alightPredefinedLinkPluginHref', href, linkRange);

          // If it's a predefined link and we have format and name, set these attributes
          if (isPredefined) {
            if (linkFormat) {
              writer.setAttribute('alightPredefinedLinkPluginFormat', linkFormat, linkRange);
            } else {
              writer.setAttribute('alightPredefinedLinkPluginFormat', 'standard', linkRange);
            }

            // Extract and set link name for predefined links
            const extractedLinkId = extractPredefinedLinkId(href);
            if (extractedLinkId) {
              writer.setAttribute('alightPredefinedLinkPluginLinkName', extractedLinkId, linkRange);
            } else if (linkName) {
              writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, linkRange);
            }
          }

          // Set truthyManualDecorators attributes
          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, linkRange);
          });

          // Remove falsyManualDecorators attributes
          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, linkRange);
          });

          // Put the selection back where it was
          writer.setSelection(position);
        }
        // If not then insert text node with `alightPredefinedLinkPluginHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          attributes.set('alightPredefinedLinkPluginHref', href);

          // If it's a predefined link, set format attribute
          if (isPredefined) {
            attributes.set('alightPredefinedLinkPluginFormat', 'standard');

            // Extract and set link name for predefined links
            const extractedLinkId = extractPredefinedLinkId(href);
            if (extractedLinkId) {
              attributes.set('alightPredefinedLinkPluginLinkName', extractedLinkId);
            }
          }

          truthyManualDecorators.forEach(item => {
            attributes.set(item, true);
          });

          const { end: positionAfter } = model.insertContent(
            writer.createText(href, attributes as any),
            position
          );

          // Put the selection at the end of the inserted link.
          writer.setSelection(positionAfter);
        }

        // Remove the `alightPredefinedLinkPluginHref` attribute and all link decorators from the selection.
        // It stops adding a new content into the link element.
        ['alightPredefinedLinkPluginHref', 'alightPredefinedLinkPluginFormat', 'alightPredefinedLinkPluginLinkName',
          ...truthyManualDecorators, ...falsyManualDecorators].forEach(item => {
            writer.removeSelectionAttribute(item);
          });
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        // WITHOUT REMOVING THEM - just applying the href attribute
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');

        // Process each range
        for (const range of ranges) {
          // Set the alightPredefinedLinkPluginHref attribute on the selected text
          writer.setAttribute('alightPredefinedLinkPluginHref', href, range);

          // If it's a predefined link, set format attribute
          if (isPredefined) {
            writer.setAttribute('alightPredefinedLinkPluginFormat', 'standard', range);

            // Extract and set link name for predefined links
            const extractedLinkId = extractPredefinedLinkId(href);
            if (extractedLinkId) {
              writer.setAttribute('alightPredefinedLinkPluginLinkName', extractedLinkId, range);
            }
          }

          // Set truthyManualDecorators attributes
          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, range);
          });

          // Remove falsyManualDecorators attributes
          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, range);
          });
        }
      }
    });

    // Fire an event after command execution to notify UI
    this._fireEvent('executed', { href, options });
  }

  /**
   * Provides information whether a decorator with a given name is present in the currently processed selection.
   */
  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for the `AlightPredefinedLinkPluginImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }
}
