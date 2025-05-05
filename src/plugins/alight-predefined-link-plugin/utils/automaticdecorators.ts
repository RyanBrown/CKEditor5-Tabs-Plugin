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
        // There is only test as this behavior decorates links and
        // it is run before dispatcher which actually consumes this node.
        // This allows on writing own dispatcher with highest priority,
        // which blocks both native converter and this additional decoration.
        if (!conversionApi.consumable.test(data.item, 'attribute:alightPredefinedLinkPluginHref')) {
          return;
        }

        // Automatic decorators for block links are handled e.g. in AlightPredefinedLinkPluginImageEditing.
        if (!(data.item.is('selection') || conversionApi.schema.isInline(data.item))) {
          return;
        }

        const viewWriter = conversionApi.writer;
        const viewSelection = viewWriter.document.selection;

        // Process automatic decorators
        for (const item of this._definitions) {
          if (item.callback(data.attributeNewValue as string | null)) {
            // For predefined links, we need to create a structure with ah:link
            // Get or extract link name
            let linkName = '';

            // In TypeScript, we need to properly check if the data.item has the hasAttribute method
            // and then check if the attribute exists before getting it
            if ('hasAttribute' in data.item && typeof data.item.hasAttribute === 'function') {
              if (data.item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
                linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName') as string;
              }
            } else if (data.attributeNewValue) {
              linkName = extractPredefinedLinkId(data.attributeNewValue as string) ||
                data.attributeNewValue as string;
            }

            // Create outer link element with all attributes
            const linkAttrs = {
              'href': '#',
              'class': 'AHCustomeLink',
              'data-id': 'predefined_link',
              ...item.attributes
            };

            // Use attributeElement for the outer link
            const linkElement = viewWriter.createAttributeElement('a', linkAttrs, { priority: 5 });

            // Add any classes from decorator
            if (item.classes) {
              viewWriter.addClass(item.classes, linkElement);
            }

            // Add any styles from decorator
            for (const key in item.styles) {
              viewWriter.setStyle(key, item.styles[key], linkElement);
            }

            // Set custom property for link identification
            viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

            // Create ah:link element with name attribute
            const ahLinkAttrs: Record<string, string> = {
              'name': linkName
            };

            // Handle custom attributes for the ah:link element
            // Safely check for custom attributes
            if ('getAttributes' in data.item && typeof data.item.getAttributes === 'function') {
              try {
                // Try to get the attributes, but gracefully handle if it fails
                const attributes = data.item.getAttributes();

                for (const [key, value] of attributes) {
                  if (typeof key === 'string' && key.startsWith('alightPredefinedLinkPluginCustom_')) {
                    // Extract the original attribute name by removing the prefix
                    const originalAttrName = key.replace('alightPredefinedLinkPluginCustom_', '');
                    ahLinkAttrs[originalAttrName] = value as string;
                  }
                }
              } catch (error) {
                console.error('Failed to get attributes from item:', error);
              }
            }

            const ahLinkElement = viewWriter.createAttributeElement('ah:link', ahLinkAttrs, { priority: 6 });

            // Set custom property for link identification
            viewWriter.setCustomProperty('alight-predefined-link-ah', true, ahLinkElement);

            if (data.item.is('selection')) {
              // When dealing with selection, apply the link elements
              const range = viewSelection.getFirstRange();

              if (range) {
                // First wrap with the ah:link element
                const ahLinkRange = viewWriter.wrap(range, ahLinkElement);

                // Then wrap the ah:link element with the linkElement
                viewWriter.wrap(ahLinkRange, linkElement);
              }
            } else {
              // For model elements, handle the view range
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              // First wrap with the ah:link element
              const ahLinkRange = viewWriter.wrap(viewRange, ahLinkElement);

              // Then wrap the ah:link element with the linkElement
              viewWriter.wrap(ahLinkRange, linkElement);
            }
          }
        }
      }, { priority: 'high' });
    };
  }
}
