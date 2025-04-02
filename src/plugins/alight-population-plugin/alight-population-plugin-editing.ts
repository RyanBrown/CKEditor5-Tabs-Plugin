// src/plugins/alight-population-plugin/alight-population-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  toWidget,
  Widget
} from '@ckeditor/ckeditor5-widget';
import type {
  DowncastWriter,
  ViewElement
} from '@ckeditor/ckeditor5-engine';

/**
 * The editing part of the AlightPopulationsPlugin.
 * This plugin handles the schema definition, conversion and editing logic.
 * 
 * IMPORTANT: This implementation uses elements instead of attributes for population tags
 * to avoid attribute conversion errors.
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

    // Upcast converters (from HTML to model)
    // Population begin tag
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

    // Population end tag
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

    // Data downcast converters (for saving to HTML)
    // Population begin tag
    conversion.for('dataDowncast').elementToElement({
      model: 'populationBegin',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        return writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-begin',
          'data-population-name': name ? String(name) : ''
        });
      }
    });

    // Population end tag
    conversion.for('dataDowncast').elementToElement({
      model: 'populationEnd',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        return writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-end',
          'data-population-name': name ? String(name) : ''
        });
      }
    });

    // Editing downcast converters (for displaying in editor)
    // Population begin tag
    conversion.for('editingDowncast').elementToElement({
      model: 'populationBegin',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const nameStr = name ? String(name) : '';
        const tagElement = this._createPopulationView(writer, 'begin', nameStr);
        return toWidget(tagElement, writer, { label: 'Population begin tag' });
      }
    });

    // Population end tag
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
    // Create a container for the tag
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
