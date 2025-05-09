import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  toWidget,
  Widget
} from '@ckeditor/ckeditor5-widget';
import type {
  DowncastWriter,
  ViewElement,
  ViewText
} from '@ckeditor/ckeditor5-engine';

/**
 * The editing part of the AlightPopulationsPlugin.
 * This plugin handles the schema definition, conversion, and editing logic.
 * 
 * This implementation ensures ah:expr tags are visible in both editing and data views,
 * while maintaining proper population markers in the HTML output and editor view.
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
   * Defines the model schema for population tags and ah:expr container.
   */
  private _defineSchema() {
    const schema = this.editor.model.schema;

    // Register population marker elements
    schema.register('populationBegin', {
      isInline: true,
      allowWhere: '$text',
      allowAttributes: ['name', 'populationId']
    });

    schema.register('populationEnd', {
      isInline: true,
      allowWhere: '$text',
      allowAttributes: ['name', 'populationId']
    });

    // Register ah:expr as a container element
    schema.register('ahExpr', {
      isObject: true, // Treat as a structural element
      allowIn: '$block', // Allow in block-level elements
      allowAttributes: ['name', 'class', 'title', 'assettype', 'populationId'],
      allowContentOf: '$block' // Allow text and inline elements inside
    });

    // Allow populationBegin and populationEnd inside ahExpr
    schema.addChildCheck((context, childDefinition) => {
      if (context.endsWith('ahExpr') &&
        (childDefinition.name === 'populationBegin' || childDefinition.name === 'populationEnd')) {
        return true;
      }
    });
  }

  /**
   * Defines converters for upcast and downcast of population tags and ah:expr.
   */
  private _defineConverters() {
    const editor = this.editor;
    const conversion = editor.conversion;

    // ========== UPCAST CONVERTERS (HTML → MODEL) ==========

    // Upcast for ah:expr element
    conversion.for('upcast').elementToElement({
      view: {
        name: 'ah:expr',
        attributes: {
          assettype: 'Expression'
        }
      },
      model: (viewElement, { writer }) => {
        const name = viewElement.getAttribute('name');
        const populationId = viewElement.getAttribute('populationId');

        if (!name) {
          console.warn('Upcast: ah:expr element missing required "name" attribute');
          return null; // Skip if no name
        }
        return writer.createElement('ahExpr', {
          name: String(name),
          class: viewElement.getAttribute('class') || 'expeSelector',
          title: viewElement.getAttribute('title') || name,
          assettype: 'Expression',
          populationId: populationId || undefined
        });
      },
      converterPriority: 'high' // Ensure this runs before child conversions
    });

    // Upcast for population begin tag (inside ah:expr)
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['cka-population-tag', 'cka-population-begin']
      },
      model: (viewElement, { writer }) => {
        // Support both attribute formats - new (populationId) and old (data-population-*)
        let name = viewElement.getAttribute('data-population-name');

        // If no data-population-name, try to extract from text content
        if (!name && viewElement.hasClass('hide-in-awl') && viewElement.childCount > 0) {
          const child = viewElement.getChild(0);
          // Make sure we're dealing with a text node
          if (child && child.is('$text')) {
            const text = (child as ViewText).data;
            // Extract name from text format "[BEGIN *name*]"
            const match = text.match(/\[BEGIN \*([^*]+)\*\]/);
            if (match && match[1]) {
              name = match[1];
            }
          }
        }

        const populationId = viewElement.getAttribute('populationId') ||
          viewElement.getAttribute('data-population-id') ||
          'generatedWhenCreated';

        if (!name) {
          console.warn('Upcast: population begin span missing name information');
          return null;
        }
        return writer.createElement('populationBegin', {
          name: String(name),
          populationId: populationId
        });
      }
    });

    // Upcast for population end tag (inside ah:expr)
    conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: ['cka-population-tag', 'cka-population-end']
      },
      model: (viewElement, { writer }) => {
        // Support both attribute formats - new (populationId) and old (data-population-*)
        let name = viewElement.getAttribute('data-population-name');

        // If no data-population-name, try to extract from text content
        if (!name && viewElement.hasClass('hide-in-awl') && viewElement.childCount > 0) {
          const child = viewElement.getChild(0);
          // Make sure we're dealing with a text node
          if (child && child.is('$text')) {
            const text = (child as ViewText).data;
            // Extract name from text format "[*name* END]"
            const match = text.match(/\[\*([^*]+)\* END\]/);
            if (match && match[1]) {
              name = match[1];
            }
          }
        }

        const populationId = viewElement.getAttribute('populationId') ||
          viewElement.getAttribute('data-population-id') ||
          'generatedWhenCreated';

        if (!name) {
          console.warn('Upcast: population end span missing name information');
          return null;
        }
        return writer.createElement('populationEnd', {
          name: String(name),
          populationId: populationId
        });
      }
    });

    // ========== DATA DOWNCAST CONVERTERS (MODEL → HTML) ==========

    // Convert ahExpr to ah:expr in the HTML output
    conversion.for('dataDowncast').elementToElement({
      model: 'ahExpr',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId');

        if (!name) {
          console.warn('Data downcast: ahExpr missing required "name" attribute');
          return null;
        }
        return writer.createContainerElement('ah:expr', {
          name: String(name),
          class: modelElement.getAttribute('class') || 'expeSelector',
          title: modelElement.getAttribute('title') || name,
          assettype: 'Expression'
          // Remove contenteditable="false" and populationId from here
        });
      }
    });

    // Convert populationBegin to span in HTML
    conversion.for('dataDowncast').elementToElement({
      model: 'populationBegin',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId') || 'generatedWhenCreated';

        if (!name) {
          console.warn('Data downcast: populationBegin missing required "name" attribute');
          return null;
        }
        const beginSpan = writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-begin hide-in-awl',
          populationId: populationId
          // Replace data-population-name and data-population-id with populationId
        });
        writer.insert(
          writer.createPositionAt(beginSpan, 0),
          writer.createText(`[BEGIN *${name}*]`)
        );
        return beginSpan;
      }
    });

    // Convert populationEnd to span in HTML
    conversion.for('dataDowncast').elementToElement({
      model: 'populationEnd',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId') || 'generatedWhenCreated';

        if (!name) {
          console.warn('Data downcast: populationEnd missing required "name" attribute');
          return null;
        }
        const endSpan = writer.createContainerElement('span', {
          class: 'cka-population-tag cka-population-end hide-in-awl',
          populationId: populationId
          // Replace data-population-name and data-population-id with populationId
        });
        writer.insert(
          writer.createPositionAt(endSpan, 0),
          writer.createText(`[*${name}* END]`)
        );
        return endSpan;
      }
    });

    // ========== EDITING DOWNCAST CONVERTERS (MODEL → EDITING VIEW) ==========

    // Convert ahExpr to ah:expr in the editing view
    conversion.for('editingDowncast').elementToElement({
      model: 'ahExpr',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId');

        if (!name) {
          console.warn('Editing downcast: ahExpr missing required "name" attribute');
          return null;
        }
        const ahExprElement = writer.createContainerElement('ah:expr', {
          name: String(name),
          class: modelElement.getAttribute('class') || 'expeSelector',
          title: modelElement.getAttribute('title') || name,
          assettype: 'Expression'
          // Remove contenteditable="false" and populationId from ahExpr
        });
        return toWidget(ahExprElement, writer, { label: `Population container: ${name}` });
      }
    });

    // Convert populationBegin in the editing view
    conversion.for('editingDowncast').elementToElement({
      model: 'populationBegin',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId');

        if (!name) {
          console.warn('Editing downcast: populationBegin missing required "name" attribute');
          return null;
        }
        const tagElement = this._createPopulationView(writer, 'begin', String(name), populationId as string);
        return toWidget(tagElement, writer, { label: 'Population begin tag' });
      }
    });

    // Convert populationEnd in the editing view
    conversion.for('editingDowncast').elementToElement({
      model: 'populationEnd',
      view: (modelElement, { writer }) => {
        const name = modelElement.getAttribute('name');
        const populationId = modelElement.getAttribute('populationId');

        if (!name) {
          console.warn('Editing downcast: populationEnd missing required "name" attribute');
          return null;
        }
        const tagElement = this._createPopulationView(writer, 'end', String(name), populationId as string);
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
   * @param {string} populationId The ID of the population.
   * @returns {ViewElement} The created view element.
   */
  private _createPopulationView(
    writer: DowncastWriter,
    type: 'begin' | 'end',
    populationName: string,
    populationId?: string
  ): ViewElement {
    // Create a container for the tag using only CSS classes - no inline styles
    const tagContainer = writer.createContainerElement('span', {
      class: `cka-population-tag cka-population-${type} hide-in-awl`,
      populationId: populationId || 'generatedWhenCreated'
      // Change to use populationId instead of data-* attributes
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
      // Find the nearest population tag element or ah:expr
      let viewElement = data.target;
      if (!viewElement) return;

      // Check if the clicked element is an ah:expr or population tag
      let populationName: string | null = null;
      let populationId: string | null = null;

      if (viewElement.name === 'ah:expr' && viewElement.getAttribute('assettype') === 'Expression') {
        populationName = viewElement.getAttribute('name');
        populationId = viewElement.getAttribute('populationId');
      } else if (viewElement.hasClass && viewElement.hasClass('cka-population-tag')) {
        // Support both old and new attribute formats
        populationName = viewElement.getAttribute('data-population-name');

        // If no data-population-name, try to extract from text content
        if (!populationName && viewElement.childCount > 0) {
          const child = viewElement.getChild(0);
          if (child && child.is('$text')) {
            const text = (child as ViewText).data;
            if (viewElement.hasClass('cka-population-begin')) {
              const match = text.match(/\[BEGIN \*([^*]+)\*\]/);
              if (match && match[1]) {
                populationName = match[1];
              }
            } else {
              const match = text.match(/\[\*([^*]+)\* END\]/);
              if (match && match[1]) {
                populationName = match[1];
              }
            }
          }
        }

        populationId = viewElement.getAttribute('populationId') ||
          viewElement.getAttribute('data-population-id');
      } else {
        // Check parent elements
        viewElement = viewElement.getAncestor('ah:expr');
        if (viewElement && viewElement.getAttribute('assettype') === 'Expression') {
          populationName = viewElement.getAttribute('name');
          populationId = viewElement.getAttribute('populationId');
        }
      }

      if (!populationName) return;

      // Prevent default behavior
      evt.stop();

      // Open the population modal with the current population name
      editor.execute('openPopulationModal', {
        populationName,
        populationId
      });
    });
  }
}
