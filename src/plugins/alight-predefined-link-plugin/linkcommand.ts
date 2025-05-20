// src/plugins/alight-predefined-link-plugin/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type { Range, Writer } from '@ckeditor/ckeditor5-engine';
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

      // The key change: Only enable if there's a non-collapsed selection OR
      // if the cursor is inside an existing link (to allow editing it)
      const hasNonCollapsedSelection = !selection.isCollapsed;
      const isInsideLink = this.value !== undefined;

      // Only enable the command if schema allows AND we have a text selection
      // or we're inside an existing link
      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref') &&
        (hasNonCollapsedSelection || isInsideLink);
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
    // Determine if href is a predefined link
    const isPredefined = isPredefinedLink(href);

    // Get linkName - for predefined links this is critical
    let linkName = '';

    const model = this.editor.model;
    const selection = model.document.selection;

    // For existing links, get the current linkName
    if (selection.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      linkName = selection.getAttribute('alightPredefinedLinkPluginLinkName') as string;
    }

    // CRITICAL: For predefined links, always set a linkName
    // This is what ensures our output structure is correct
    if (isPredefined) {
      // If no existing linkName, extract from href or generate one
      if (!linkName) {
        linkName = extractPredefinedLinkId(href) || href;

        // If still no valid linkName, generate one
        if (!linkName || linkName.trim() === '') {
          linkName = 'link-' + Math.random().toString(36).substring(2, 7);
        }
      }
    }

    model.change(writer => {
      // If selection is collapsed then update selected link or insert new one
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition()!;

        // When selection is inside text with `alightPredefinedLinkPluginHref` attribute
        if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
          // Get the link range
          const linkRange = findAttributeRange(
            position,
            'alightPredefinedLinkPluginHref',
            selection.getAttribute('alightPredefinedLinkPluginHref'),
            model
          );

          // Always update all required attributes together
          writer.setAttribute('alightPredefinedLinkPluginHref', href, linkRange);
          writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', linkRange);
          writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName || href, linkRange);

          // Process decorator options
          this._processDecoratorOptions(writer, linkRange, options);

          // Restore selection
          writer.setSelection(position);
        }
        // If not, then insert text node with link attributes
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          // Always set all link attributes together
          attributes.set('alightPredefinedLinkPluginHref', href);
          attributes.set('alightPredefinedLinkPluginFormat', 'ahcustom');
          attributes.set('alightPredefinedLinkPluginLinkName', linkName || href);

          // Set decorator attributes
          this._setDecoratorAttributes(attributes, options);

          // Create text with appropriate display text
          const linkText = isPredefined ? linkName : href;

          const { end: positionAfter } = model.insertContent(
            writer.createText(linkText, attributes as any),
            position
          );

          // Put selection at the end of the inserted link
          writer.setSelection(positionAfter);
        }

        // Remove link attributes from selection
        this._removeAttributesFromSelection(writer);
      }
      // For non-collapsed selections, apply attributes to existing text
      else {
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');

        // Process each range
        for (const range of ranges) {
          // Always update all attributes for consistency
          writer.setAttribute('alightPredefinedLinkPluginHref', href, range);
          writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
          writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName || href, range);

          // Process decorator options
          this._processDecoratorOptions(writer, range, options);
        }
      }
    });

    // Fire event after command execution to notify UI
    this._fireEvent('executed', { href, options });
  }

  /**
   * Helper method to remove all link-related attributes from a range.
   * This method is used by the UnlinkCommand to ensure all attributes are properly removed.
   * 
   * @param writer The model writer
   * @param range The range to remove attributes from
   */
  public removeAllLinkAttributes(writer: Writer, range: Range): void {
    // Remove the primary link attribute
    writer.removeAttribute('alightPredefinedLinkPluginHref', range);

    // Remove additional predefined link attributes
    writer.removeAttribute('alightPredefinedLinkPluginFormat', range);
    writer.removeAttribute('alightPredefinedLinkPluginLinkName', range);

    // Remove standard link attributes that might also be present
    writer.removeAttribute('linkHref', range);

    // Remove commonly used decorator attributes
    const commonDecorators = [
      'linkIsExternal',
      'linkIsDownloadable',
      'linkTarget',
      'linkRel',
      'data-id',
      'class',
      'AHCustomeLink'
    ];

    for (const decorator of commonDecorators) {
      writer.removeAttribute(decorator, range);
    }

    // Remove all decorator attributes
    for (const decorator of this.manualDecorators) {
      writer.removeAttribute(decorator.id, range);
    }

    // Thoroughly check for link-related attributes across the entire range
    const items = Array.from(range.getItems());
    for (const item of items) {
      if (item.is('$text') || item.is('$textProxy')) {
        const attributeNames = Array.from(item.getAttributeKeys());

        for (const key of attributeNames) {
          // Remove any attribute that might be related to links
          if (typeof key === 'string' && (
            key.startsWith('link') ||
            key.includes('link') ||
            key.includes('href') ||
            key.includes('LinkPlugin') ||
            key.includes('AHCustome') ||
            key === 'data-id'
          )) {
            writer.removeAttribute(key, item);
          }
        }
      }
    }
  }

  /**
   * Processes decorator options and applies them to the range
   * 
   * @param writer The model writer
   * @param range The range to apply decorators to
   * @param options The decorator options
   */
  private _processDecoratorOptions(writer: Writer, range: Range, options: LinkOptions): void {
    // Handle manual decorators for truthiness and falsiness
    for (const [name, value] of Object.entries(options)) {
      if (value === true) {
        writer.setAttribute(name, true, range);
      } else if (value === false) {
        writer.removeAttribute(name, range);
      }
    }
  }

  /**
   * Sets decorator attributes on the attributes map
   * 
   * @param attributes The attributes map to update
   * @param options The decorator options to apply
   */
  private _setDecoratorAttributes(attributes: Map<string, unknown>, options: LinkOptions): void {
    // Add truthy decorator attributes to the attributes map
    for (const [name, value] of Object.entries(options)) {
      if (value === true) {
        attributes.set(name, true);
      }
    }
  }

  /**
   * Removes link attributes from the current selection
   * 
   * @param writer The model writer
   */
  private _removeAttributesFromSelection(writer: Writer): void {
    // List of attributes to remove
    const attributesToRemove = [
      'alightPredefinedLinkPluginHref',
      'alightPredefinedLinkPluginFormat',
      'alightPredefinedLinkPluginLinkName'
    ];

    // Add decorator attributes
    for (const decorator of this.manualDecorators) {
      attributesToRemove.push(decorator.id);
    }

    // Remove all attributes
    for (const attribute of attributesToRemove) {
      writer.removeSelectionAttribute(attribute);
    }
  }

  /**
   * Provides information whether a decorator is present in the current selection.
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
