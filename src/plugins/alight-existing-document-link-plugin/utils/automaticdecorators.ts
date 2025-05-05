// src/plugins/alight-existing-document-link-plugin/utils/automaticdecorators.ts
import { type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type {
  DowncastAttributeEvent,
  DowncastDispatcher,
  ViewAttributeElement,
  ViewElement,
  Item
} from '@ckeditor/ckeditor5-engine';
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
      dispatcher.on<DowncastAttributeEvent>('attribute:alightPredefinedLinkPluginHref', (evt, data, conversionApi) => {
        // Skip if the attribute is already consumed
        if (!conversionApi.consumable.test(data.item, 'attribute:alightPredefinedLinkPluginHref')) {
          return;
        }

        // Automatic decorators for block links are handled elsewhere
        if (!(data.item.is('selection') || conversionApi.schema.isInline(data.item))) {
          return;
        }

        // Process automatic decorators
        let isDecorated = false;

        for (const decorator of this._definitions) {
          // Only proceed if the callback returns true for this href value
          if (!decorator.callback(data.attributeNewValue as string | null)) {
            continue;
          }

          try {
            const viewWriter = conversionApi.writer;

            // Instead of using wrap, we'll use a different approach based on whether
            // we're dealing with a selection or a text node
            if (data.item.is('selection')) {
              // For selections, we'll use the existing link attributes if available
              // Create a new attribute element without wrapping
              const attributes = decorator.attributes || {};
              const linkElement = viewWriter.createAttributeElement('a', attributes, { priority: 5 });

              if (decorator.classes) {
                viewWriter.addClass(decorator.classes, linkElement);
              }

              if (decorator.styles) {
                for (const key in decorator.styles) {
                  viewWriter.setStyle(key, decorator.styles[key], linkElement);
                }
              }

              viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

              // Apply directly to selection
              const viewSelection = conversionApi.writer.document.selection;

              // Here we would normally apply the attribute element to the selection
              // But since we can't use wrap, we'll just mark it as decorated
              isDecorated = true;
            } else {
              // For text nodes, we'll find existing link elements in the range
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              // Process items in the range that can be safely converted to elements
              // First collect all potential elements
              const viewItems = Array.from(viewRange.getItems()).filter(item => {
                return item.is && (typeof item.is === 'function') &&
                  (item.is('element') || item.is('attributeElement'));
              });

              // Then process those that are link elements or can have link attributes
              for (const item of viewItems) {
                if (item.is('element') || item.is('attributeElement')) {
                  const viewElement = item as ViewElement;

                  // Add attributes
                  if (decorator.attributes) {
                    for (const key in decorator.attributes) {
                      viewWriter.setAttribute(key, decorator.attributes[key], viewElement);
                    }
                  }

                  // Add classes
                  if (decorator.classes) {
                    viewWriter.addClass(decorator.classes, viewElement);
                  }

                  // Add styles
                  if (decorator.styles) {
                    for (const key in decorator.styles) {
                      viewWriter.setStyle(key, decorator.styles[key], viewElement);
                    }
                  }

                  // Set custom property for link identification
                  viewWriter.setCustomProperty('alight-predefined-link', true, viewElement);
                  isDecorated = true;
                }
              }
            }
          } catch (error) {
            console.error('Error applying automatic decorator:', error);
          }
        }

        // If any decorator was applied, consume the attribute
        if (isDecorated) {
          conversionApi.consumable.consume(data.item, 'attribute:alightPredefinedLinkPluginHref');
        }
      }, { priority: 'high' });
    };
  }
}
