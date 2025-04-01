// src/plugins/alight-population-plugin/alight-population-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import {
  toWidget,
  toWidgetEditable,
  Widget
} from '@ckeditor/ckeditor5-widget';
import type {
  DowncastWriter,
  ViewElement,
  UpcastElementEvent
} from '@ckeditor/ckeditor5-engine';

/**
 * The editing part of the AlightPopulationsPlugin.
 * This plugin handles the schema definition, conversion and editing logic.
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

    // Allow population tag attributes on text nodes
    schema.extend('$text', {
      allowAttributes: [
        'population-tag',
        'population-name'
      ]
    });

    // Make sure population attributes can be used anywhere text is allowed
    schema.addAttributeCheck((context) => {
      // If the element is a text node, allow population attributes
      if (context.endsWith('$text')) {
        return true;
      }
      return false;
    });
  }

  /**
   * Defines converters for upcast and downcast of population tags.
   */
  private _defineConverters() {
    const editor = this.editor;
    const conversion = editor.conversion;
    const view = editor.editing.view;

    // Set up data upcast converters (for loading content)
    // Population begin tag upcast
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        classes: ['population-tag', 'population-begin']
      },
      model: {
        key: 'population-tag',
        value: () => 'begin'
      }
    });

    // Population name attribute upcast
    conversion.for('upcast').attributeToAttribute({
      view: {
        name: 'span',
        key: 'data-population-name'
      },
      model: 'population-name'
    });

    // Population end tag upcast
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        classes: ['population-tag', 'population-end']
      },
      model: {
        key: 'population-tag',
        value: () => 'end'
      }
    });

    // Set up data downcast converters (for saving content)
    // Population begin tag downcast
    conversion.for('dataDowncast').attributeToElement({
      model: {
        key: 'population-tag',
        values: ['begin']
      },
      view: (modelAttributeValue, { writer }, { item }) => {
        if (modelAttributeValue !== 'begin') return null;

        const populationName = String(item.getAttribute('population-name'));

        return writer.createContainerElement('span', {
          class: 'population-tag population-begin',
          'data-population-name': populationName
        });
      }
    });

    // Population end tag downcast
    conversion.for('dataDowncast').attributeToElement({
      model: {
        key: 'population-tag',
        values: ['end']
      },
      view: (modelAttributeValue, { writer }, { item }) => {
        if (modelAttributeValue !== 'end') return null;

        const populationName = String(item.getAttribute('population-name'));

        return writer.createContainerElement('span', {
          class: 'population-tag population-end',
          'data-population-name': populationName
        });
      }
    });

    // Set up editing downcast converters (for displaying in the editor)
    // Population begin tag editing downcast
    conversion.for('editingDowncast').attributeToElement({
      model: {
        key: 'population-tag',
        values: ['begin']
      },
      view: (modelAttributeValue, { writer }, { item }) => {
        if (modelAttributeValue !== 'begin') return null;

        const populationName = String(item.getAttribute('population-name'));
        const populationElement = this._createPopulationView(writer, 'begin', populationName);

        // Make the tag an uneditable widget
        return toWidget(populationElement, writer, { label: 'Population begin tag' });
      }
    });

    // Population end tag editing downcast
    conversion.for('editingDowncast').attributeToElement({
      model: {
        key: 'population-tag',
        values: ['end']
      },
      view: (modelAttributeValue, { writer }, { item }) => {
        if (modelAttributeValue !== 'end') return null;

        const populationName = String(item.getAttribute('population-name'));
        const populationElement = this._createPopulationView(writer, 'end', populationName);

        // Make the tag an uneditable widget
        return toWidget(populationElement, writer, { label: 'Population end tag' });
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
      class: `population-tag population-${type}`,
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
      const isPopulationTag = viewElement.hasClass && viewElement.hasClass('population-tag');
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