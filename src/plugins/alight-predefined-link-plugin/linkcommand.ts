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
    // Clean up empty href for non-predefined links
    if ((href === '' || href === '#') && !isPredefinedLink(href)) {
      href = '#'; // Use a minimum valid href
    }

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

    // For predefined links, always use the link name from the href or the current linkName
    if (isPredefined) {
      // If we don't have a link name yet, extract it from the href
      if (!linkName) {
        linkName = extractPredefinedLinkId(href) || href;
      }

      // NEW VALIDATION: Ensure predefinedLinkName is not empty for predefined links
      if (!linkName || linkName.trim() === '') {
        console.error('Predefined link must have a valid linkName. Operation aborted.');
        // You could throw an error here, or add UI feedback, or set a default value
        // For now, we'll use the href as a last resort fallback
        linkName = href;

        // Optionally, you could add a notification to the UI
        const notification = this.editor.plugins.has('Notification') ?
          this.editor.plugins.get('Notification') : null;

        if (notification) {
          notification.showWarning(
            'Predefined link requires a name. Using link ID as fallback.',
            {
              namespace: 'alightPredefinedLinkPlugin',
              title: 'Link Warning'
            }
          );
        }
      }
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

          // Find and remove orgnameattr attribute if it exists
          this._removeOrgnameAttr(writer, linkRange);

          // If it's a predefined link and we have format and name, set these attributes
          if (isPredefined) {
            if (linkFormat) {
              writer.setAttribute('alightPredefinedLinkPluginFormat', linkFormat, linkRange);
            } else {
              writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', linkRange);
            }

            // NEW VALIDATION: Always set the linkName attribute for predefined links
            writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, linkRange);
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

          // If it's a predefined link, set format attribute and linkName
          if (isPredefined) {
            attributes.set('alightPredefinedLinkPluginFormat', 'ahcustom');

            // NEW VALIDATION: Ensure linkName is set for predefined links
            attributes.set('alightPredefinedLinkPluginLinkName', linkName);
          }

          truthyManualDecorators.forEach(item => {
            attributes.set(item, true);
          });

          // Create text with the link text
          // Instead of using the href as text, use a better display name for predefined links
          const linkText = isPredefined ? linkName : href;

          const { end: positionAfter } = model.insertContent(
            writer.createText(linkText, attributes as any),
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
        // IMPORTANT FIX: For non-collapsed selections, we need to keep the original text
        // and just apply the link attributes to it
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightPredefinedLinkPluginHref');

        // Process each range
        for (const range of ranges) {
          // Find and remove orgnameattr attribute if it exists
          this._removeOrgnameAttr(writer, range);

          // Set the alightPredefinedLinkPluginHref attribute on the selected text
          writer.setAttribute('alightPredefinedLinkPluginHref', href, range);

          // If it's a predefined link, set format attributes
          if (isPredefined) {
            writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);

            // NEW VALIDATION: Always set the linkName for predefined links
            writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
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

    // A check for the `AlightPredefinedLinkPluginImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }
}
