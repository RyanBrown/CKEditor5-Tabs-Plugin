// src/plugins/alight-predefined-link-plugin/utils/automaticdecorators.ts
import { toMap, type ArrayOrItem } from '@ckeditor/ckeditor5-utils';
import type {
  DowncastAttributeEvent,
  DowncastDispatcher,
  Element,
  ViewElement,
  ViewContainerElement,
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
              'href': '#',
              'class': 'AHCustomLink',
              'data-id': 'predefined_link',
              ...item.attributes
            };

            // Use attributeElement instead of containerElement
            const linkElement = viewWriter.createAttributeElement('a', linkAttrs, { priority: 5 });

            // Add any classes from decorator
            if (item.classes) {
              viewWriter.addClass(item.classes, linkElement);
            }

            // Add any styles from decorator
            for (const key in item.styles) {
              viewWriter.setStyle(key, item.styles[key], linkElement);
            }

            // Create the inner ah:link element
            const ahLinkElement = viewWriter.createAttributeElement('ah:link', {
              'name': linkName
            }, { priority: 4 });  // Lower priority than the link element

            // Set custom property for link identification
            viewWriter.setCustomProperty('alight-predefined-link', true, linkElement);

            if (data.item.is('selection')) {
              // When wrapping a selection, we need to:
              // 1. Create a range to wrap
              const range = viewSelection.getFirstRange();

              if (range) {
                // 2. Wrap the range with our link element
                viewWriter.wrap(range, linkElement);

                // 3. Apply the ah:link element within the link element 
                // We do this by finding all text nodes and wrapping them with the ah:link
                const nodes = Array.from(range.getItems()).filter(node =>
                  node.is('$text') || node.is('$textProxy'));

                if (nodes.length) {
                  const textRange = viewWriter.createRange(
                    viewWriter.createPositionBefore(nodes[0]),
                    viewWriter.createPositionAfter(nodes[nodes.length - 1])
                  );
                  viewWriter.wrap(textRange, ahLinkElement);
                }
              }
            } else {
              // For model elements, we need to:
              // 1. Convert model range to view range
              const viewRange = conversionApi.mapper.toViewRange(data.range);

              // 2. Wrap the range with our link element
              viewWriter.wrap(viewRange, linkElement);

              // 3. Apply the ah:link element within the link element
              viewWriter.wrap(viewRange, ahLinkElement);
            }
          } else {
            // If callback returned false, we should remove the link attributes
            // instead of trying to unwrap them, which is causing TypeScript errors

            // For selections, remove attributes from elements in the selection
            if (data.item.is('selection')) {
              const ranges = viewSelection.getRanges();

              for (const range of ranges) {
                const elementsInRange = Array.from(range.getItems())
                  .filter(item =>
                    item.is('attributeElement') &&
                    item.name === 'a' &&
                    item.hasClass('AHCustomLink') &&
                    item.getAttribute('data-id') === 'predefined_link'
                  ) as ViewAttributeElement[]; // Add proper type casting

                // Remove link attributes from elements
                for (const element of elementsInRange) {
                  // Remove by replacing attributes
                  viewWriter.removeAttribute('href', element);
                  viewWriter.removeAttribute('data-id', element);
                  viewWriter.removeClass('AHCustomLink', element);

                  // Find and handle ah:link elements
                  const ahLinkElements = Array.from(element.getChildren())
                    .filter(child => child.is('element', 'ah:link')) as ViewAttributeElement[]; // Add proper type casting

                  for (const ahLink of ahLinkElements) {
                    // Just remove the name attribute which should effectively disable the link
                    viewWriter.removeAttribute('name', ahLink);
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
                  item.hasClass('AHCustomLink') &&
                  item.getAttribute('data-id') === 'predefined_link'
                ) as ViewAttributeElement[]; // Add proper type casting

              // Remove link attributes
              for (const element of elementsInRange) {
                // Remove attributes 
                viewWriter.removeAttribute('href', element);
                viewWriter.removeAttribute('data-id', element);
                viewWriter.removeClass('AHCustomLink', element);

                // Find ah:link elements
                const ahLinkElements = Array.from(element.getChildren())
                  .filter(child => child.is('element', 'ah:link')) as ViewAttributeElement[]; // Add proper type casting

                for (const ahLink of ahLinkElements) {
                  // Just remove the name attribute
                  viewWriter.removeAttribute('name', ahLink);
                }
              }
            }
          }
        }
      }, { priority: 'high' });
    };
  }
}
