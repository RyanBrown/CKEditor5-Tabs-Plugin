// src/plugins/alight-predefined-link-plugin/utils/automaticdecorators.ts
// This updates the automatic decorator handling to respect the different downcast/upcast formats

import { type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type {
  DowncastAttributeEvent,
  DowncastDispatcher,
  ViewAttributeElement
} from '@ckeditor/ckeditor5-engine';
import type { NormalizedLinkDecoratorAutomaticDefinition } from '../utils';
import { extractPredefinedLinkId } from '../utils';

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

            // For selection, we need to handle it differently than for text nodes
            if (data.item.is('selection')) {
              const viewSelection = viewWriter.document.selection;
              const ranges = viewSelection.getRanges();

              // Only proceed if there are ranges to process
              for (const range of ranges) {
                if (range.isCollapsed) {
                  continue;
                }

                // Create the attribute element
                const linkElement = viewWriter.createAttributeElement(
                  'a',
                  decorator.attributes || {},
                  { priority: 5 }
                );

                // Add classes if defined
                if (decorator.classes) {
                  viewWriter.addClass(decorator.classes, linkElement);
                }

                // Add styles if defined
                if (decorator.styles) {
                  for (const key in decorator.styles) {
                    viewWriter.setStyle(key, decorator.styles[key], linkElement);
                  }
                }

                // Set custom property for link identification
                viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

                // Apply the wrapper to the range
                viewWriter.wrap(range, linkElement);
                isDecorated = true;
              }
            } else {
              // Handle regular text nodes
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              // Create the attribute element
              const linkElement = viewWriter.createAttributeElement(
                'a',
                decorator.attributes || {},
                { priority: 5 }
              );

              // Add classes if defined
              if (decorator.classes) {
                viewWriter.addClass(decorator.classes, linkElement);
              }

              // Add styles if defined
              if (decorator.styles) {
                for (const key in decorator.styles) {
                  viewWriter.setStyle(key, decorator.styles[key], linkElement);
                }
              }

              // Set custom property for link identification
              viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

              // Apply the wrapper to the range
              viewWriter.wrap(viewRange, linkElement);
              isDecorated = true;
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
