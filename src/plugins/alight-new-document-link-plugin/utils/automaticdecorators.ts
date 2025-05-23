// src/plugins/alight-new-document-link-plugin/utils/automaticdecorators.ts
import type { ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type { DowncastAttributeEvent, DowncastDispatcher } from '@ckeditor/ckeditor5-engine';
import type { NormalizedLinkDecoratorAutomaticDefinition } from '../utils';

/**
 * Helper class that ties together all {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition} and provides
 * the {@link module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement downcast dispatchers} for them.
 */
export default class AutomaticDecorators {
  /**
   * Stores the definition of {@link module:link/linkconfig~LinkDecoratorAutomaticDefinition automatic decorators}.
   * This data is used as a source for a downcast dispatcher to create a proper conversion to output data.
   */
  private _definitions = new Set<NormalizedLinkDecoratorAutomaticDefinition>();

  /**
   * Gives information about the number of decorators stored in the {@link module:link/utils/automaticdecorators~AutomaticDecorators}
   * instance.
   */
  public get length(): number {
    return this._definitions.size;
  }

  /**
   * Adds automatic decorator objects or an array with them to be used during downcasting.
   *
   * @param item A configuration object of automatic rules for decorating links. It might also be an array of such objects.
   */
  public add(item: ArrayOrItem<NormalizedLinkDecoratorAutomaticDefinition>): void {
    if (Array.isArray(item)) {
      item.forEach(item => this._definitions.add(item));
    } else {
      this._definitions.add(item);
    }
  }

  /**
   * Provides the conversion helper used in the {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add} method.
   *
   * @returns A dispatcher function used as conversion helper in {@link module:engine/conversion/downcasthelpers~DowncastHelpers#add}.
   */
  public getDispatcher(): (dispatcher: DowncastDispatcher) => void {
    return dispatcher => {
      dispatcher.on<DowncastAttributeEvent>('attribute:alightNewDocumentLinkPluginHref', (evt, data, conversionApi) => {
        // There is only test as this behavior decorates links and
        // it is run before dispatcher which actually consumes this node.
        // This allows on writing own dispatcher with highest priority,
        // which blocks both native converter and this additional decoration.
        if (!conversionApi.consumable.test(data.item, 'attribute:alightNewDocumentLinkPluginHref')) {
          return;
        }

        // Automatic decorators for block links are handled e.g. in AlightNewDocumentLinkPluginImageEditing.
        if (!(data.item.is('selection') || conversionApi.schema.isInline(data.item))) {
          return;
        }

        const viewWriter = conversionApi.writer;
        const viewSelection = viewWriter.document.selection;

        for (const item of this._definitions) {
          // Build attributes with data-id
          const attributes: Record<string, string> = {
            ...item.attributes,
            'data-id': 'new-document_link'
          };

          // Create link element
          const viewElement = viewWriter.createAttributeElement('a', attributes, { priority: 5 });

          // Add classes and styles
          if (item.classes) {
            viewWriter.addClass(item.classes, viewElement);
          }

          for (const key in item.styles) {
            viewWriter.setStyle(key, item.styles[key], viewElement);
          }

          viewWriter.setCustomProperty('alight-new-document-link', true, viewElement);

          // Apply or remove decoration
          if (item.callback(data.attributeNewValue as string | null)) {
            if (data.item.is('selection')) {
              viewWriter.wrap(viewSelection.getFirstRange()!, viewElement);
            } else {
              viewWriter.wrap(conversionApi.mapper.toViewRange(data.range), viewElement);
            }
          } else {
            viewWriter.unwrap(conversionApi.mapper.toViewRange(data.range), viewElement);
          }
        }
      }, { priority: 'high' });
    };
  }
}
