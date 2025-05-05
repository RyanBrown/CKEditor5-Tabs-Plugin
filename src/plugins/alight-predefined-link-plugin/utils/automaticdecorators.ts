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

        const viewWriter = conversionApi.writer;
        const viewSelection = viewWriter.document.selection;

        // Process automatic decorators
        for (const item of this._definitions) {
          // Only proceed if the callback returns true for this href value
          if (item.callback(data.attributeNewValue as string | null)) {
            try {
              // Create attributes for the link element
              const linkAttrs: Record<string, string> = {
                'href': '#',
                'class': 'AHCustomeLink',
                'data-id': 'predefined_link'
              };

              // Add any additional attributes from decorator
              if (item.attributes) {
                Object.assign(linkAttrs, item.attributes);
              }

              // Create the main attribute element for the link
              const linkElement = viewWriter.createAttributeElement('a', linkAttrs, { priority: 5 });

              // Add any classes from decorator
              if (item.classes) {
                viewWriter.addClass(item.classes, linkElement);
              }

              // Add any styles from decorator
              if (item.styles) {
                for (const key in item.styles) {
                  viewWriter.setStyle(key, item.styles[key], linkElement);
                }
              }

              // Set custom property for link identification
              viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

              // Now wrap the content with this link element
              if (data.item.is('selection')) {
                // Make sure the range is valid before wrapping
                const range = viewSelection.getFirstRange();
                if (range && !range.isCollapsed) {
                  viewWriter.wrap(range, linkElement);
                }
              } else {
                // For model items, map to view range and wrap
                const viewRange = conversionApi.mapper.toViewRange(data.range);
                if (viewRange) {
                  viewWriter.wrap(viewRange, linkElement);
                }
              }
            } catch (error) {
              // Log error but don't break the editor
              console.error('Error applying automatic decorator:', error);
            }
          }
        }
      }, { priority: 'high' });
    };
  }
}
