// src/plugins/alight-existing-document-link/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type { Range, Writer } from '@ckeditor/ckeditor5-engine';
import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement, isExistingDocumentLink, extractExternalDocumentLinkId } from './utils';
import type ManualDecorator from './utils/manualdecorator';

/**
 * Interface for link options
 */
interface LinkOptions {
  [key: string]: boolean | string | undefined;
}

/**
 * The link command. It is used by the {@link module:link/link~AlightExistingDocumentLinkPlugin link feature}.
 */
export default class AlightExistingDocumentLinkPluginCommand extends Command {
  /**
   * The value of the `'AlightExistingDocumentLinkPluginHref'` attribute if the start of the selection is located in a node with this attribute.
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

    // A check for any integration that allows linking elements (e.g. `AlightExistingDocumentLinkPluginImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('AlightExistingDocumentLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'AlightExistingDocumentLinkPluginHref');
    } else {
      this.value = selection.getAttribute('AlightExistingDocumentLinkPluginHref') as string | undefined;

      // Only enable if there's a non-collapsed selection OR the cursor is inside an existing link
      const hasNonCollapsedSelection = !selection.isCollapsed;
      const isInsideLink = this.value !== undefined;

      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'AlightExistingDocumentLinkPluginHref') &&
        (hasNonCollapsedSelection || isInsideLink);
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is non-collapsed, the `AlightExistingDocumentLinkPluginHref` attribute will be applied to nodes inside the selection, but only to
   * those nodes where the `AlightExistingDocumentLinkPluginHref` attribute is allowed (disallowed nodes will be omitted).
   *
   * When the selection is collapsed and is not inside the text with the `AlightExistingDocumentLinkPluginHref` attribute, a
   * new {@link module:engine/model/text~Text text node} with the `AlightExistingDocumentLinkPluginHref` attribute will be inserted in place of the caret, but
   * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
   * The selection will be updated to wrap the just inserted text node.
   *
   * When the selection is collapsed and inside the text with the `AlightExistingDocumentLinkPluginHref` attribute, the attribute value will be updated.
   *
   * @fires execute
   * @param href AlightExistingDocumentLinkPlugin destination.
   * @param options Options including manual decorator attributes.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    // Clean up empty href for non-existing document links
    if ((href === '' || href === '#') && !isExistingDocumentLink(href)) {
      href = '#'; // Use a minimum valid href
    }

    // Determine if href is a existing document link ID
    const isExistingDocument = isExistingDocumentLink(href);

    // Get the format attribute from the current selection if it exists
    let linkFormat = '';
    let linkName = '';

    const model = this.editor.model;
    const selection = model.document.selection;

    // Check if the current link has a existing document format we need to preserve
    if (selection.hasAttribute('AlightExistingDocumentLinkPluginFormat')) {
      linkFormat = selection.getAttribute('AlightExistingDocumentLinkPluginFormat') as string;
    }

    // Check if the current link has a link name attribute we need to preserve
    if (selection.hasAttribute('AlightExistingDocumentLinkPluginLinkName')) {
      linkName = selection.getAttribute('AlightExistingDocumentLinkPluginLinkName') as string;
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

        // When selection is inside text with `AlightExistingDocumentLinkPluginHref` attribute.
        if (selection.hasAttribute('AlightExistingDocumentLinkPluginHref')) {
          // Get the link range
          const linkRange = findAttributeRange(
            position,
            'AlightExistingDocumentLinkPluginHref',
            selection.getAttribute('AlightExistingDocumentLinkPluginHref'),
            model
          );

          // Update the existing link with the new href
          writer.setAttribute('AlightExistingDocumentLinkPluginHref', href, linkRange);

          // Find and remove orgnameattr attribute if it exists
          this._removeOrgnameAttr(writer, linkRange);

          // If it's a existing document link and we have format and name, set these attributes
          if (isExistingDocument) {
            if (linkFormat) {
              writer.setAttribute('AlightExistingDocumentLinkPluginFormat', linkFormat, linkRange);
            } else {
              writer.setAttribute('AlightExistingDocumentLinkPluginFormat', 'standard', linkRange);
            }

            // Extract and set link name for existing document links
            const extractedLinkId = extractExternalDocumentLinkId(href);
            if (extractedLinkId) {
              writer.setAttribute('AlightExistingDocumentLinkPluginLinkName', extractedLinkId, linkRange);
            } else if (linkName) {
              writer.setAttribute('AlightExistingDocumentLinkPluginLinkName', linkName, linkRange);
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
        // If not then insert text node with `AlightExistingDocumentLinkPluginHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          attributes.set('AlightExistingDocumentLinkPluginHref', href);

          // If it's a existing document link, set format attribute
          if (isExistingDocument) {
            attributes.set('AlightExistingDocumentLinkPluginFormat', 'standard');

            // Extract and set link name for existing document links
            const extractedLinkId = extractExternalDocumentLinkId(href);
            if (extractedLinkId) {
              attributes.set('AlightExistingDocumentLinkPluginLinkName', extractedLinkId);
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

        // Remove the `AlightExistingDocumentLinkPluginHref` attribute and all link decorators from the selection.
        // It stops adding a new content into the link element.
        ['AlightExistingDocumentLinkPluginHref', 'AlightExistingDocumentLinkPluginFormat', 'AlightExistingDocumentLinkPluginLinkName',
          ...truthyManualDecorators, ...falsyManualDecorators].forEach(item => {
            writer.removeSelectionAttribute(item);
          });
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        // WITHOUT REMOVING THEM - just applying the href attribute
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'AlightExistingDocumentLinkPluginHref');

        // Process each range
        for (const range of ranges) {
          // Find and remove orgnameattr attribute if it exists
          this._removeOrgnameAttr(writer, range);

          // Set the AlightExistingDocumentLinkPluginHref attribute on the selected text
          writer.setAttribute('AlightExistingDocumentLinkPluginHref', href, range);

          // If it's a existing document link, set format attribute
          if (isExistingDocument) {
            writer.setAttribute('AlightExistingDocumentLinkPluginFormat', 'standard', range);

            // Extract and set link name for existing document links
            const extractedLinkId = extractExternalDocumentLinkId(href);
            if (extractedLinkId) {
              writer.setAttribute('AlightExistingDocumentLinkPluginLinkName', extractedLinkId, range);
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
   * Removes the orgnameattr attribute from a given range if it exists.
   * This handles both orgnameattr="" and orgnameattr attribute formats.
   * 
   * @param writer The model writer
   * @param range The range to process
   */
  private _removeOrgnameAttr(writer: Writer, range: Range): void {
    // Remove the orgnameattr attribute from the range
    // The schema check isn't needed here because removeAttribute is safe to call even if the attribute doesn't exist
    writer.removeAttribute('orgnameattr', range);
  }

  /**
   * Provides information whether a decorator with a given name is present in the currently processed selection.
   */
  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for the `AlightExistingDocumentLinkPluginImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }
}
