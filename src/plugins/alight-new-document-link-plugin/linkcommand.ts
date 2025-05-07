// src/plugins/alight-new-document-link-plugin/linkcommand.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { Collection, first, toMap } from '@ckeditor/ckeditor5-utils';
import type { Range } from '@ckeditor/ckeditor5-engine';
import AutomaticDecorators from './utils/automaticdecorators';
import { isLinkableElement } from './utils';
import type ManualDecorator from './utils/manualdecorator';

/**
 * Interface for link options
 */
interface LinkOptions {
  [key: string]: boolean | string | undefined;
}

/**
 * The link command. It is used by the {@link module:link/link~AlightNewDocumentLinkPlugin link feature}.
 */
export default class AlightNewDocumentLinkPluginCommand extends Command {
  /**
   * The value of the `'alightNewDocumentLinkPluginHref'` attribute if the start of the selection is located in a node with this attribute.
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

    // A check for any integration that allows linking elements (e.g. `AlightNewDocumentLinkPluginImage`).
    // Currently the selection reads attributes from text nodes only. See #7429 and #7465.
    if (isLinkableElement(selectedElement, model.schema)) {
      this.value = selectedElement.getAttribute('alightNewDocumentLinkPluginHref') as string | undefined;
      this.isEnabled = model.schema.checkAttribute(selectedElement, 'alightNewDocumentLinkPluginHref');
    } else {
      this.value = selection.getAttribute('alightNewDocumentLinkPluginHref') as string | undefined;

      // Determine if the command should be enabled based on selection state and schema
      const schemaAllowsAttribute = model.schema.checkAttributeInSelection(selection, 'alightNewDocumentLinkPluginHref');
      const hasSelection = !selection.isCollapsed;
      const isInLink = selection.hasAttribute('alightNewDocumentLinkPluginHref');

      // The command should be enabled only if:
      // 1. The schema allows the attribute AND
      // 2. Either there is a text selection OR the cursor is inside an existing link
      this.isEnabled = schemaAllowsAttribute && (hasSelection || isInLink);
    }

    for (const manualDecorator of this.manualDecorators) {
      manualDecorator.value = this._getDecoratorStateFromModel(manualDecorator.id);
    }
  }

  /**
   * Executes the command.
   *
   * When the selection is non-collapsed, the `alightNewDocumentLinkPluginHref` attribute will be applied to nodes inside the selection, but only to
   * those nodes where the `alightNewDocumentLinkPluginHref` attribute is allowed (disallowed nodes will be omitted).
   *
   * When the selection is collapsed and is not inside the text with the `alightNewDocumentLinkPluginHref` attribute, a
   * new {@link module:engine/model/text~Text text node} with the `alightNewDocumentLinkPluginHref` attribute will be inserted in place of the caret, but
   * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
   * The selection will be updated to wrap the just inserted text node.
   *
   * When the selection is collapsed and inside the text with the `alightNewDocumentLinkPluginHref` attribute, the attribute value will be updated.
   *
   * @fires execute
   * @param href Document link destination.
   * @param options Options including manual decorator attributes and document title.
   */
  public override execute(href: string, options: LinkOptions = {}): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // Extract document title if provided
    const documentTitle = options.documentTitle;

    // Log the execution parameters
    console.log('Executing AlightNewDocumentLinkPluginCommand with:', {
      href,
      documentTitle,
      options
    });

    // Extract decorator options
    const truthyManualDecorators: Array<string> = [];
    const falsyManualDecorators: Array<string> = [];

    for (const name in options) {
      if (name !== 'documentTitle') {
        if (options[name] === true) {
          truthyManualDecorators.push(name);
        } else if (options[name] === false) {
          falsyManualDecorators.push(name);
        }
      }
    }

    model.change(writer => {
      // Handle collapsed or non-collapsed selection
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition()!;

        // When selection is inside text with `alightNewDocumentLinkPluginHref` attribute.
        if (selection.hasAttribute('alightNewDocumentLinkPluginHref')) {
          // Get the link range
          const linkRange = findAttributeRange(
            position,
            'alightNewDocumentLinkPluginHref',
            selection.getAttribute('alightNewDocumentLinkPluginHref'),
            model
          );

          // Update the attribute value.
          writer.setAttribute('alightNewDocumentLinkPluginHref', href, linkRange);

          // Add document title if available
          if (documentTitle) {
            writer.setAttribute('documentTitle', documentTitle, linkRange);
            console.log('Added documentTitle attribute to existing link:', documentTitle);
          }

          // Add decorators
          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, linkRange);
          });

          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, linkRange);
          });

          // Put the selection at the end of the updated link.
          writer.setSelection(writer.createPositionAfter(linkRange.end.nodeBefore!));
        }
        // If not then insert text node with `alightNewDocumentLinkPluginHref` attribute in place of caret.
        else if (href !== '') {
          const attributes = toMap(selection.getAttributes());

          attributes.set('alightNewDocumentLinkPluginHref', href);

          // Add document title if available
          if (documentTitle) {
            attributes.set('documentTitle', documentTitle);
            console.log('Added documentTitle attribute to new link:', documentTitle);
          }

          truthyManualDecorators.forEach(item => {
            attributes.set(item, true);
          });

          // Create display text for the new link
          let displayText = this._createDisplayText(href, documentTitle as string);

          const { end: positionAfter } = model.insertContent(
            writer.createText(displayText, attributes as any),
            position
          );

          // Put the selection at the end of the inserted link.
          writer.setSelection(positionAfter);
        }

        // Remove the attributes from the selection.
        ['alightNewDocumentLinkPluginHref', 'documentTitle', ...truthyManualDecorators, ...falsyManualDecorators].forEach(item => {
          writer.removeSelectionAttribute(item);
        });
      } else {
        // If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightNewDocumentLinkPluginHref');

        // Process each range
        for (const range of ranges) {
          // Apply link href
          writer.setAttribute('alightNewDocumentLinkPluginHref', href, range);

          // Add document title if available
          if (documentTitle) {
            writer.setAttribute('documentTitle', documentTitle, range);
            console.log('Added documentTitle attribute to range:', documentTitle);
          }

          // Add decorators
          truthyManualDecorators.forEach(item => {
            writer.setAttribute(item, true, range);
          });

          // Remove decorators
          falsyManualDecorators.forEach(item => {
            writer.removeAttribute(item, range);
          });
        }
      }
    });
  }

  /**
   * Creates a display text for the new document link based on the href.
   * For document links, we use the provided document title or extract a meaningful display text from the path.
   */
  private _createDisplayText(href: string, documentTitle?: string): string {
    // If a document title is provided, use it
    if (documentTitle) {
      return documentTitle;
    }

    // If it's a folder path with a document ID, use a more user-friendly display
    if (href.includes('/')) {
      const parts = href.split('/');

      // If there are at least two parts (folder and ID)
      if (parts.length >= 2) {
        const folder = parts[0].trim();
        return `${folder}: Document`;
      }
    }

    // Default to just returning the href
    return href;
  }

  /**
   * Provides information whether a decorator with a given name is present in the currently processed selection.
   * 
   * @param decoratorName The name of the decorator to check
   * @returns The state of the decorator (true if active, false if inactive, undefined if not applicable)
   */
  private _getDecoratorStateFromModel(decoratorName: string): boolean | undefined {
    const model = this.editor.model;
    const selection = model.document.selection;
    const selectedElement = selection.getSelectedElement();

    // A check for the `AlightNewDocumentLinkPluginImage` plugin.
    if (isLinkableElement(selectedElement, model.schema)) {
      return selectedElement.getAttribute(decoratorName) as boolean | undefined;
    }

    return selection.getAttribute(decoratorName) as boolean | undefined;
  }
}
