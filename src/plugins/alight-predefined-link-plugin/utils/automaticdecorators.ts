// src/plugins/alight-predefined-link-plugin/automaticdecorators.ts
import { type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type {
  DowncastAttributeEvent,
  DowncastDispatcher,
  ViewElement
} from '@ckeditor/ckeditor5-engine';
import type { NormalizedLinkDecoratorAutomaticDefinition } from '../utils';

/**
 * Helper class that ties together all automatic link decorator definitions and provides
 * the downcast dispatchers for them.
 */
export default class AutomaticDecorators {
  /**
   * Stores the definition of automatic decorators.
   * This data is used as a source for a downcast dispatcher to create a proper conversion to output data.
   */
  private _definitions = new Set<NormalizedLinkDecoratorAutomaticDefinition>();

  /**
   * Gives information about the number of decorators stored in the AutomaticDecorators instance.
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
   * Provides the conversion helper used in the downcast method.
   * Updated to ensure consistent output format for predefined links.
   *
   * @returns A dispatcher function used as conversion helper.
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

            // Instead of using wrap, we'll use a different approach
            if (data.item.is('selection')) {
              // For selections, we need to be very careful - no wrapping
              // We'll just mark it as decorated, but the actual attributes will be applied
              // during direct editing downcast
              isDecorated = true;
            } else {
              // For text nodes, get the mapper to find the corresponding view element
              if (data.range) {
                const viewRange = conversionApi.mapper.toViewRange(data.range);

                // Iterate over items in the range that can be safely modified
                for (const item of viewRange.getItems()) {
                  // Skip non-element items
                  if (!item.is('element') && !item.is('attributeElement')) {
                    continue;
                  }

                  const viewElement = item as ViewElement;

                  // Apply the decorator attributes directly to the element
                  if (decorator.attributes) {
                    for (const key in decorator.attributes) {
                      viewWriter.setAttribute(key, decorator.attributes[key], viewElement);
                    }
                  }

                  if (decorator.classes) {
                    viewWriter.addClass(decorator.classes, viewElement);
                  }

                  for (const key in decorator.styles || {}) {
                    viewWriter.setStyle(key, decorator.styles[key], viewElement);
                  }

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
