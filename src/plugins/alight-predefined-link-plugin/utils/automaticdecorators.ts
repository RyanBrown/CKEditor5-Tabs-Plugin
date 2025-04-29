// src/plugins/alight-predefined-link-plugin/utils/automaticdecorators.ts
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

            if (data.item.hasAttribute && data.item.hasAttribute('alightPredefinedLinkPluginLinkName')) {
              linkName = data.item.getAttribute('alightPredefinedLinkPluginLinkName') as string;
            } else if (data.attributeNewValue) {
              linkName = extractPredefinedLinkId(data.attributeNewValue as string) ||
                data.attributeNewValue as string;
            }

            // Create outer link element with all attributes
            const linkAttrs = {
              'class': 'AHCustomeLink',
              'data-id': 'predefined_link',
              ...item.attributes
            };

            // Use attributeElement instead of containerElement to maintain proper nesting
            const linkElement = viewWriter.createAttributeElement('a', linkAttrs, { priority: 5 });

            // Add any classes from decorator
            if (item.classes) {
              viewWriter.addClass(item.classes, linkElement);
            }

            // Add any styles from decorator
            for (const key in item.styles) {
              viewWriter.setStyle(key, item.styles[key], linkElement);
            }

            // Create the ah:link element
            const ahLinkAttrs = {
              'name': linkName,
              'href': data.attributeNewValue as string,
              'data-id': 'predefined_link'
            };

            const ahLinkElement = viewWriter.createAttributeElement('ah:link', ahLinkAttrs, { priority: 6 });

            // Set custom property for link identification
            viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);
            viewWriter.setCustomProperty('alight-predefined-link-ah', true, ahLinkElement);

            if (data.item.is('selection')) {
              // When dealing with selection, apply the link elements
              const range = viewSelection.getFirstRange();

              if (range) {
                // First apply the <a> element
                const linkRange = viewWriter.wrap(range, linkElement);

                // Then apply the <ah:link> element to the same content
                const ahLinkRange = viewSelection.getFirstRange();
                if (ahLinkRange) {
                  viewWriter.wrap(ahLinkRange, ahLinkElement);
                }
              }
            } else {
              // For model elements, handle the view range
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              // Apply the <a> element
              viewWriter.wrap(viewRange, linkElement);

              // Then apply the <ah:link> element to the same content
              const ahLinkViewRange = conversionApi.mapper.toViewRange(data.range);
              viewWriter.wrap(ahLinkViewRange, ahLinkElement);
            }
          } else {
            // If callback returned false, we should remove the link attributes

            // For selections, remove attributes from elements in the selection
            if (data.item.is('selection')) {
              const ranges = viewSelection.getRanges();

              for (const range of ranges) {
                const elementsInRange = Array.from(range.getItems())
                  .filter(item =>
                    item.is('attributeElement') &&
                    item.name === 'a' &&
                    item.hasClass('AHCustomeLink')
                  ) as ViewAttributeElement[]; // Add proper type casting

                // Remove link attributes from elements
                for (const element of elementsInRange) {
                  // Remove by replacing attributes
                  viewWriter.removeAttribute('class', element);
                  viewWriter.removeAttribute('data-id', element);

                  // Find and handle ah:link elements
                  const ahLinkElements = Array.from(range.getItems())
                    .filter(item =>
                      item.is('attributeElement') &&
                      item.name === 'ah:link' &&
                      item.hasAttribute('onclick')
                    ) as ViewAttributeElement[];

                  for (const ahLink of ahLinkElements) {
                    // Remove the attributes from ah:link elements
                    viewWriter.removeAttribute('onclick', ahLink);
                    viewWriter.removeAttribute('href', ahLink);
                    viewWriter.removeAttribute('data-id', ahLink);
                  }
                }
              }
            } else {
              // For model elements, handle range-based removal
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              const elementsInRange = Array.from(viewRange.getItems())
                .filter(item =>
                  item.is('attributeElement') &&
                  item.name === 'a' &&
                  item.hasClass('AHCustomeLink')
                ) as ViewAttributeElement[]; // Add proper type casting

              // Remove link attributes
              for (const element of elementsInRange) {
                // Remove attributes 
                viewWriter.removeAttribute('class', element);
                viewWriter.removeAttribute('data-id', element);

                // Find ah:link elements in the same range
                const ahLinkElements = Array.from(viewRange.getItems())
                  .filter(item =>
                    item.is('attributeElement') &&
                    item.name === 'ah:link' &&
                    item.hasAttribute('onclick')
                  ) as ViewAttributeElement[];

                for (const ahLink of ahLinkElements) {
                  // Remove the attributes from ah:link elements
                  viewWriter.removeAttribute('onclick', ahLink);
                  viewWriter.removeAttribute('href', ahLink);
                  viewWriter.removeAttribute('data-id', ahLink);
                }
              }
            }
          }
        }
      }, { priority: 'high' });
    };
  }
}
