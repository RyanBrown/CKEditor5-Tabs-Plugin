// src/plugins/alight-population-plugin/alight-population-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  toWidget,
  Widget
} from '@ckeditor/ckeditor5-widget';
import type {
  DowncastWriter,
  ViewElement,
  ViewDocumentFragment,
  ViewContainerElement,
  UpcastElementEvent
} from '@ckeditor/ckeditor5-engine';

/**
 * The editing part of the AlightPopulationsPlugin.
 * This plugin handles the schema definition, conversion and editing logic.
 * 
 * This implementation uses elements for population tags and properly handles
 * ah:expr tags in the HTML output.
 */
export default class AlightPopulationPluginEditing extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPopulationPluginEditing';
  }

  /**
   * @inheritDoc
   */
  static get requires() {
    return [Widget];
  }

  /**
   * @inheritDoc
   */
  init() {
    this._defineSchema();
    this._defineConverters();
  }

  /**
   * Defines the model schema for population tags.
   */
  private _defineSchema() {
    const schema = this.editor.model.schema;

    // Register population marker elements
    schema.register('populationBegin', {
      isInline: true,
      allowWhere: '$text',
      allowAttributes: ['name']
    });

    schema.register('populationEnd', {
      isInline: true,
      allowWhere: '$text',
      allowAttributes: ['name']
    });
  }

  /**
   * Defines converters for upcast and downcast of population tags.
   */
  private _defineConverters() {
    const editor = this.editor;
    const conversion = editor.conversion;

    // ========== UPCAST CONVERTERS (HTML → MODEL) ==========

    // Custom upcast handler for ah:expr elements
    conversion.for('upcast').add(dispatcher => {
      // Handle upcast of ah:expr elements
      dispatcher.on('element:ah:expr', (evt, data, conversionApi) => {
        const viewItem = data.viewItem;

        // Check if this is a population ah:expr tag
        if (viewItem.getAttribute('assettype') !== 'population') {
          return;
        }

        // Don't convert if this was already consumed
        if (!conversionApi.consumable.test(viewItem, { name: true })) {
          return;
        }

        // We don't need to create any special model element for the ah:expr tag itself
        // The content and the begin/end span tags will be converted separately
        // We just need to consume the ah:expr tag so it doesn't cause errors
        conversionApi.consumable.consume(viewItem, { name: true });

        // Process children. The begin and end spans will be converted by their own converters
        conversionApi.convertChildren(viewItem, data.modelCursor);
      });
    });

    // Upcast converter for population begin tag (HTML → Model)
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['cka-population-tag', 'cka-population-begin']
      },
      model: (viewElement, { writer }) => {
        const name = viewElement.getAttribute('data-population-name') || '';
        return writer.createElement('populationBegin', { name });
      }
    });

    // Upcast converter for population end tag (HTML → Model)
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['cka-population-tag', 'cka-population-end']
      },
      model: (viewElement, { writer }) => {
        const name = viewElement.getAttribute('data-population-name') || '';
        return writer.createElement('populationEnd', { name });
      }
    });

    // ========== DATA DOWNCAST CONVERTERS (MODEL → HTML) ==========

    // Custom downcast handler for population structure in HTML output
    conversion.for('dataDowncast').add(dispatcher => {
      // Create proper mapping for begin tags with ah:expr wrappers
      dispatcher.on('insert:populationBegin', (evt, data, conversionApi) => {
        const { item } = data;
        const name = item.getAttribute('name') || '';

        if (!conversionApi.consumable.consume(item, 'insert')) {
          return;
        }

        // Create the ah:expr container
        const ahExpr = conversionApi.writer.createContainerElement('ah:expr', {
          name,
          class: 'expeSelector',
          title: name,
          assettype: 'population'
        });

        // Create the begin tag span
        const beginSpan = conversionApi.writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-begin',
          'data-population-name': name
        });

        // Add text content to the span
        conversionApi.writer.insert(
          conversionApi.writer.createPositionAt(beginSpan, 0),
          conversionApi.writer.createText(`[BEGIN *${name}*]`)
        );

        // Add the span to the ah:expr element
        conversionApi.writer.insert(
          conversionApi.writer.createPositionAt(ahExpr, 0),
          beginSpan
        );

        // Insert into document
        const viewPosition = conversionApi.mapper.toViewPosition(
          conversionApi.writer.createPositionBefore(item)
        );

        conversionApi.mapper.bindElements(item, beginSpan);
        conversionApi.writer.insert(viewPosition, ahExpr);
      });

      // Handle end tags
      dispatcher.on('insert:populationEnd', (evt, data, conversionApi) => {
        const { item } = data;
        const name = item.getAttribute('name') || '';

        if (!conversionApi.consumable.consume(item, 'insert')) {
          return;
        }

        // Create the end tag span
        const endSpan = conversionApi.writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-end',
          'data-population-name': name
        });

        // Add text content to the span
        conversionApi.writer.insert(
          conversionApi.writer.createPositionAt(endSpan, 0),
          conversionApi.writer.createText(`[*${name}* END]`)
        );

        // Insert into document
        const viewPosition = conversionApi.mapper.toViewPosition(
          conversionApi.writer.createPositionBefore(item)
        );

        conversionApi.mapper.bindElements(item, endSpan);
        conversionApi.writer.insert(viewPosition, endSpan);

        // Close the ah:expr tag - we rely on the HTML serializer to properly nest these elements
      });

      return { priority: 'high' };
    });

    // ========== EDITING DOWNCAST CONVERTERS (MODEL → EDITING VIEW) ==========

    // Editing downcast converter for populationBegin (for editor display)
    conversion.for('editingDowncast').elementToElement({
      model: 'populationBegin',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const nameStr = name ? String(name) : '';
        const tagElement = this._createPopulationView(writer, 'begin', nameStr);
        return toWidget(tagElement, writer, { label: 'Population begin tag' });
      }
    });

    // Editing downcast converter for populationEnd (for editor display)
    conversion.for('editingDowncast').elementToElement({
      model: 'populationEnd',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const nameStr = name ? String(name) : '';
        const tagElement = this._createPopulationView(writer, 'end', nameStr);
        return toWidget(tagElement, writer, { label: 'Population end tag' });
      }
    });

    // Add double-click handler to open the edit modal
    this._enableDoubleClickHandler();
  }

  /**
   * Creates a view element for a population tag.
   * 
   * @param {DowncastWriter} writer The downcast writer.
   * @param {string} type The tag type ('begin' or 'end').
   * @param {string} populationName The name of the population.
   * @returns {ViewElement} The created view element.
   */
  private _createPopulationView(writer: DowncastWriter, type: 'begin' | 'end', populationName: string): ViewElement {
    // Create a container for the tag using only CSS classes - no inline styles
    const tagContainer = writer.createContainerElement('span', {
      class: `cka-population-tag cka-population-${type}`,
      'data-population-name': populationName
    });

    // Create the text content for the tag
    let tagContent;
    if (type === 'begin') {
      tagContent = writer.createText(`[BEGIN *${populationName}*]`);
    } else {
      tagContent = writer.createText(`[*${populationName}* END]`);
    }

    writer.insert(writer.createPositionAt(tagContainer, 0), tagContent);

    return tagContainer;
  }

  /**
   * Enables double-click handler on population tags to open the edit modal.
   */
  private _enableDoubleClickHandler() {
    const editor = this.editor;
    const view = editor.editing.view;

    // Add observer for handling double-click on population tags
    view.document.on('dblclick', (evt, data) => {
      // Find the nearest population tag element
      const viewElement = data.target;
      if (!viewElement) return;

      // Check if the clicked element is a population tag
      const isPopulationTag = viewElement.hasClass &&
        (viewElement.hasClass('cka-population-tag') ||
          viewElement.hasClass('population-tag'));

      if (!isPopulationTag) return;

      // Get the population name
      const populationName = viewElement.getAttribute && viewElement.getAttribute('data-population-name');
      if (!populationName) return;

      // Prevent default behavior
      evt.stop();

      // Open the population modal with the current population name
      editor.execute('openPopulationModal', { populationName });
    });
  }
}
