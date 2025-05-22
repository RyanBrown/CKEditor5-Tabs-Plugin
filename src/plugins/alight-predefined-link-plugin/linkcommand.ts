// src/plugins/alight-predefined-link-plugin/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type {
  Range,
  Writer,
  Element,
  Selection,
  Position,
  DocumentSelection,
  Node as ModelNode
} from '@ckeditor/ckeditor5-engine';
import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement, isPredefinedLink, extractPredefinedLinkId } from './utils';
import { isModelElementWithName } from './utils';
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

    // Check for ahLinkWrapper element first
    if (selectedElement && isModelElementWithName(selectedElement, 'ahLinkWrapper')) {
      this.value = selectedElement.getAttribute('href') as string | undefined;
      this.isEnabled = true;
      return;
    }

    // A check for any integration that allows linking elements (e.g. `AlightPredefinedLinkPluginImage`).
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('alightPredefinedLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightPredefinedLinkPluginHref');
    } else {
      this.value = selection.getAttribute('alightPredefinedLinkPluginHref') as string | undefined;

      // Enable if there's a non-collapsed selection OR if cursor is inside an existing link
      const hasNonCollapsedSelection = !selection.isCollapsed;
      const isInsideLink = this.value !== undefined;

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
   * @param href Link destination.
   * @param options Options including manual decorator attributes.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    const isPredefined = isPredefinedLink(href);
    const model = this.editor.model;
    const selection = model.document.selection;

    let linkName = this._deriveLinkName(selection, isPredefined, href);

    console.log('Executing link command:', { href, isPredefined, linkName });

    model.change(writer => {
      // For predefined links, use ahLinkWrapper structure
      if (isPredefined) {
        this._executeWithCustomElements(href, linkName, options, writer);
      } else {
        // For standard links, use attribute-based approach
        this._executeWithAttributes(href, linkName, options, writer);
      }
    });

    // Fire event after command execution to notify UI
    this._fireEvent('executed', { href, options });
  }

  /**
   * Creates a predefined link using ahLinkWrapper and ahLink elements
   */
  private _executeWithCustomElements(href: string, linkName: string, options: LinkOptions, writer: Writer): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Check if we're editing an existing ahLinkWrapper
    const selectedElement = selection.getSelectedElement();
    if (selectedElement && isModelElementWithName(selectedElement, 'ahLinkWrapper')) {
      // Update existing ahLinkWrapper
      writer.setAttribute('href', href, selectedElement);

      // Find and update the ahLink element
      const ahLinkElement = Array.from(selectedElement.getChildren())
        .find(child => isModelElementWithName(child, 'ahLink'));

      if (ahLinkElement) {
        writer.setAttribute('name', linkName, ahLinkElement);
      }
      return;
    }

    // Create new predefined link structure
    const ahLinkWrapper = writer.createElement('ahLinkWrapper', {
      href: href,
      class: 'AHCustomeLink',
      dataId: 'predefined_link'
    });

    const ahLink = writer.createElement('ahLink', {
      name: linkName
    });

    // Insert the nested element structure
    writer.append(ahLink, ahLinkWrapper);

    // Get text content from selection or use the link name
    let textContent = '';

    if (!selection.isCollapsed) {
      // If there's selected text, use it as the link text
      const selectedText = Array.from(selection.getFirstRange()!.getItems())
        .filter(item => item.is('$text'))
        .map(item => (item as any).data)
        .join('');

      textContent = selectedText || linkName;

      // Remove the selected content first
      model.deleteContent(selection);
    } else {
      textContent = linkName;
    }

    // Create and append text node to ahLink
    const textNode = writer.createText(textContent);
    writer.append(textNode, ahLink);

    // Insert the linked content at the current selection
    model.insertContent(ahLinkWrapper, selection);

    // Move selection after the inserted link
    const positionAfter = model.createPositionAfter(ahLinkWrapper);
    writer.setSelection(positionAfter);

    console.log('Created predefined link with ahLinkWrapper structure');
  }

  /**
   * Creates a standard link using attribute-based approach
   */
  private _executeWithAttributes(href: string, linkName: string, options: LinkOptions, writer: Writer): void {
    const model = this.editor.model;
    const selection = model.document.selection;

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

        this._applyLinkAttributes(writer, linkRange, href, linkName, false, options);

        // Restore selection
        writer.setSelection(position);
      }
      // If not, then insert text node with link attributes
      else if (href !== '') {
        const attributes = toMap(selection.getAttributes());

        attributes.set('alightPredefinedLinkPluginHref', href);

        // Set decorator attributes
        this._setDecoratorAttributes(attributes, options);

        // Create text with href as display text for standard links
        const linkText = href;

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
        this._applyLinkAttributes(writer, range, href, linkName, false, options);
      }
    }

    console.log('Created standard link with attributes');
  }

  private _applyLinkAttributes(writer: Writer, range: Range, href: string, linkName: string, isPredefined: boolean, options: LinkOptions): void {
    writer.setAttribute('alightPredefinedLinkPluginHref', href, range);
    if (isPredefined) {
      writer.setAttribute('alightPredefinedLinkPluginFormat', 'ahcustom', range);
      writer.setAttribute('alightPredefinedLinkPluginLinkName', linkName, range);
    }
    this._processDecoratorOptions(writer, range, options);
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

  /**
   * Derives a link name from the href, selection, and whether this is a predefined link
   * 
   * @param selection The current selection
   * @param isPredefined Whether this is a predefined link
   * @param href The link href
   * @returns The derived link name
   */
  private _deriveLinkName(selection: DocumentSelection, isPredefined: boolean, href: string): string {
    let linkName = '';

    // Get link name from selection if it exists
    if (selection.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      linkName = selection.getAttribute('alightPredefinedLinkPluginLinkName') as string;
    }

    // For predefined links, use the href as the link name since it's the predefined link identifier
    if (isPredefined && !linkName) {
      // For predefined links, the href IS the link name/identifier
      linkName = href;
      if (!linkName || !linkName.trim()) {
        linkName = 'link-' + Math.random().toString(36).substring(2, 7);
      }
    }

    return linkName;
  }

  /**
   * Debug method - add this to your AlightPredefinedLinkPluginCommand class
   */
  public debugCreatePredefinedLink(href: string, linkName: string): void {
    console.log('=== DEBUG: Creating predefined link ===');
    console.log('href:', href);
    console.log('linkName:', linkName);
    console.log('isPredefined:', isPredefinedLink(href));

    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      console.log('=== Inside model.change ===');

      // Force create ahLinkWrapper structure
      const ahLinkWrapper = writer.createElement('ahLinkWrapper', {
        href: href,
        class: 'AHCustomeLink',
        dataId: 'predefined_link'
      });

      const ahLink = writer.createElement('ahLink', {
        name: linkName
      });

      // Create text content
      const textContent = selection.isCollapsed ? linkName : 'Selected Text';
      const textNode = writer.createText(textContent);

      // Build the structure: ahLinkWrapper > ahLink > text
      writer.append(textNode, ahLink);
      writer.append(ahLink, ahLinkWrapper);

      console.log('Created elements:', {
        ahLinkWrapper: ahLinkWrapper.name,
        ahLink: ahLink.name,
        textContent
      });

      // Insert into the document
      if (!selection.isCollapsed) {
        model.deleteContent(selection);
      }

      model.insertContent(ahLinkWrapper, selection);

      // Move cursor after the link
      const positionAfter = model.createPositionAfter(ahLinkWrapper);
      writer.setSelection(positionAfter);

      console.log('=== Finished creating link ===');
    });
  }
}
