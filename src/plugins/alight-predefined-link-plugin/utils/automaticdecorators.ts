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
        // Only test as this behavior decorates links and is run before dispatcher which actually consumes this node
        if (!conversionApi.consumable.test(data.item, 'attribute:alightPredefinedLinkPluginHref')) {
          return;
        }

        // Skip block elements - automatic decorators for block links are handled elsewhere
        if (!(data.item.is('selection') || conversionApi.schema.isInline(data.item))) {
          return;
        }

        const viewWriter = conversionApi.writer;
        const viewSelection = viewWriter.document.selection;
        const href = data.attributeNewValue as string | null;

        // Process each automatic decorator when href is available
        for (const decorator of this._definitions) {
          if (href && decorator.callback(href)) {
            // Find all relevant elements in the view range
            const viewRange = conversionApi.mapper.toViewRange(data.range);

            // We need to find both <a> elements and <ah:link> elements
            for (const item of Array.from(viewRange.getItems())) {
              // Skip non-text items
              if (!item.is || !item.is('$text')) {
                continue;
              }

              // Find the <a> ancestor
              const linkElement = findLinkElement(item);
              if (!linkElement) {
                continue;
              }

              // Apply decorator attributes to the <a> element
              if (decorator.attributes) {
                for (const [key, value] of Object.entries(decorator.attributes)) {
                  viewWriter.setAttribute(key, value, linkElement);
                }
              }

              // Apply classes
              if (decorator.classes) {
                const classes = Array.isArray(decorator.classes) ? decorator.classes : [decorator.classes];
                for (const className of classes) {
                  viewWriter.addClass(className, linkElement);
                }
              }

              // Apply styles
              if (decorator.styles) {
                for (const [key, value] of Object.entries(decorator.styles)) {
                  viewWriter.setStyle(key, value, linkElement);
                }
              }
            }
          }
        }
      }, { priority: 'high' });
    };
  }
}

/**
 * Helper function to find a link element ancestor
 */
function findLinkElement(item: any): ViewAttributeElement | null {
  if (!item.getAncestors) {
    return null;
  }

  return item.getAncestors().find((ancestor: any) =>
    ancestor.is('attributeElement', 'a') &&
    ancestor.hasClass('AHCustomeLink') &&
    ancestor.getAttribute('data-id') === 'predefined_link'
  );
}
