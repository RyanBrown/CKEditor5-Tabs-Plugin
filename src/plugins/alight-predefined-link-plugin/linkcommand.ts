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

  private _executionContext = new WeakMap(); // Track execution context

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

      this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightPredefinedLinkPluginHref') &&
        (hasNonCollapsedSelection || isInsideLink);
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Enhanced execute method with better attribute management
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    const isPredefined = isPredefinedLink(href);
    const model = this.editor.model;
    const selection = model.document.selection;

    // Create execution context to prevent interference
    const executionId = Symbol('execution');
    this._executionContext.set(selection, executionId);

    let linkName = this._deriveLinkName(href, selection, isPredefined);

    model.change(writer => {
      try {
        if (selection.isCollapsed) {
          this._handleCollapsedSelection(writer, selection, href, linkName, isPredefined, options);
        } else {
          this._handleNonCollapsedSelection(writer, selection, href, linkName, isPredefined, options);
        }
      } catch (error) {
        console.error('Error executing link command:', error);
      } finally {
        // Clean up execution context
        this._executionContext.delete(selection);
      }
    });

    this._fireEvent('executed', { href, options });
  }

  /**
   * Handle collapsed selection (cursor position)
   */
  private _handleCollapsedSelection(
    writer: Writer,
    selection: any,
    href: string,
    linkName: string,
    isPredefined: boolean,
    options: LinkOptions
  ): void {
    const position = selection.getFirstPosition()!;

    if (selection.hasAttribute('alightPredefinedLinkPluginHref')) {
      // Update existing link
      const linkRange = findAttributeRange(
        position,
        'alightPredefinedLinkPluginHref',
        selection.getAttribute('alightPredefinedLinkPluginHref'),
        this.editor.model
      );

      this._applyLinkAttributes(writer, linkRange, href, linkName, isPredefined, options);
      writer.setSelection(position);
    } else if (href !== '') {
      // Create new link
      this._createNewLinkAtPosition(writer, position, href, linkName, isPredefined, options, selection);
    }

    this._removeAttributesFromSelection(writer);
  }

  /**
   * Handle non-collapsed selection (text selection)
   */
  private _handleNonCollapsedSelection(
    writer: Writer,
    selection: any,
    href: string,
    linkName: string,
    isPredefined: boolean,
    options: LinkOptions
  ): void {
    const ranges = this.editor.model.schema.getValidRanges(
      selection.getRanges(),
      'alightPredefinedLinkPluginHref'
    );

    for (const range of ranges) {
      this._applyLinkAttributes(writer, range, href, linkName, isPredefined, options);
    }
  }

  /**
   * Create new link at cursor position  
   */
  private _createNewLinkAtPosition(
    writer: Writer,
    position: any,
    href: string,
    linkName: string,
    isPredefined: boolean,
    options: LinkOptions,
    selection: any
  ): void {
    const attributes = toMap(selection.getAttributes());

    // Set link attributes
    attributes.set('alightPredefinedLinkPluginHref', href);

    if (isPredefined) {
      attributes.set('alightPredefinedLinkPluginFormat', 'ahcustom');
      attributes.set('alightPredefinedLinkPluginLinkName', linkName);
    }

    this._setDecoratorAttributes(attributes, options);

    // Create text with appropriate display text
    const linkText = isPredefined ? linkName : href;
    const { end: positionAfter } = this.editor.model.insertContent(
      writer.createText(linkText, attributes as any),
      position
    );

    writer.setSelection(positionAfter);
  }

  /**
   * Apply link attributes to a range with atomic operations
   */
  private _applyLinkAttributes(
    writer: Writer,
    range: Range,
    href: string,
    linkName: string,
    isPredefined: boolean,
    options: LinkOptions
  ): void {
    // Apply all attributes in a batch for consistency
    const attributesToSet = new Map<string, any>();

    attributesToSet.set('alightPredefinedLinkPluginHref', href);

    if (isPredefined) {
      attributesToSet.set('alightPredefinedLinkPluginFormat', 'ahcustom');

      // For predefined links, ensure linkName matches the href
      // since href IS the predefinedLinkName for these links
      const updatedLinkName = extractPredefinedLinkId(href) || href;
      attributesToSet.set('alightPredefinedLinkPluginLinkName', updatedLinkName);
    } else {
      // For non-predefined links, remove predefined attributes
      writer.removeAttribute('alightPredefinedLinkPluginFormat', range);
      writer.removeAttribute('alightPredefinedLinkPluginLinkName', range);
    }

    // Apply all link attributes atomically
    attributesToSet.forEach((value, key) => {
      writer.setAttribute(key, value, range);
    });

    // Then apply decorators
    this._processDecoratorOptions(writer, range, options);
  }

  private _processDecoratorOptions(writer: Writer, range: Range, options: LinkOptions): void {
    for (const [name, value] of Object.entries(options)) {
      if (value === true) {
        writer.setAttribute(name, true, range);
      } else if (value === false) {
        writer.removeAttribute(name, range);
      }
    }
  }

  private _setDecoratorAttributes(attributes: Map<string, unknown>, options: LinkOptions): void {
    for (const [name, value] of Object.entries(options)) {
      if (value === true) {
        attributes.set(name, true);
      }
    }
  }

  private _removeAttributesFromSelection(writer: Writer): void {
    const attributesToRemove = [
      'alightPredefinedLinkPluginHref',
      'alightPredefinedLinkPluginFormat',
      'alightPredefinedLinkPluginLinkName'
    ];

    for (const decorator of this.manualDecorators) {
      attributesToRemove.push(decorator.id);
    }

    attributesToRemove.forEach(attribute => {
      writer.removeSelectionAttribute(attribute);
    });
  }

  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }
    return selection.getAttribute(decoratorName) as boolean | undefined;
  }

  private _deriveLinkName(href: string, selection: any, isPredefined: boolean): string {
    let linkName = '';

    if (isPredefined) {
      // For predefined links, always derive from the href
      // Don't use the old linkName attribute
      linkName = extractPredefinedLinkId(href) || href;

      if (!linkName || !linkName.trim()) {
        linkName = 'link-' + Math.random().toString(36).substring(2, 7);
      }
    } else if (selection.hasAttribute('alightPredefinedLinkPluginLinkName')) {
      // Only use existing linkName for non-predefined links
      linkName = selection.getAttribute('alightPredefinedLinkPluginLinkName') as string;
    }
    return linkName;
  }
}
