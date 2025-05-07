// src/plugins/alight-population-plugin/alight-population-plugin-command.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Command } from '@ckeditor/ckeditor5-core';
import type { Writer } from '@ckeditor/ckeditor5-engine';
import type { Element, Range, Selection, DocumentSelection, Position } from '@ckeditor/ckeditor5-engine';

/**
 * Command for adding population tags around selected content.
 */
export class AddPopulationCommand extends Command {
  /**
   * @inheritDoc
   */
  override refresh() {
    // The command can be executed when the editor has focus and when selection exists
    const selection = this.editor.model.document.selection;

    // Check if the selection contains any disallowed elements
    const canBeEnabled = this._checkIfSelectionCanBeCovered(selection);

    this.isEnabled = canBeEnabled && selection.getFirstRange() !== null;
  }

  /**
   * Executes the command to add population tags.
   * 
   * @param {Object} options The command options.
   * @param {string} options.populationName The name of the population to add.
   */
  override execute({ populationName }: { populationName: string }) {
    if (!populationName) {
      console.error('Population name is required');
      return;
    }

    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If there's no selection, insert empty population tags at the cursor position
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition();
        if (!position) {
          console.error('No valid position found');
          return;
        }

        const emptyPopulationRange = this._insertEmptyPopulation(writer, position, populationName);

        // Set selection between the tags
        writer.setSelection(emptyPopulationRange);
        return;
      }

      // If there's an existing population in the selection, remove it first
      if (this._isSelectionInPopulation(selection)) {
        // Execute the remove population command
        editor.execute('removePopulation');
      }

      const ranges = Array.from(selection.getRanges());

      // Process each range in the selection
      for (const range of ranges) {
        if (range.isCollapsed) continue;

        // Create population tags for the range
        this._addPopulationToRange(writer, range, populationName);
      }
    });
  }

  /**
   * Checks if the selection can be covered with population tags.
   * 
   * @param {Selection|DocumentSelection} selection The selection to check.
   * @returns {boolean} Whether the selection can be covered.
   */
  private _checkIfSelectionCanBeCovered(selection: Selection | DocumentSelection): boolean {
    // List of elements that cannot be inside a population
    const disallowedElements = [
      'tabTitle',
      'sectionTitle',
      'tableCell'
    ];

    // Check if the selection contains any disallowed elements
    for (const range of selection.getRanges()) {
      const walker = range.getWalker({ ignoreElementEnd: true });

      for (const { item } of walker) {
        if (item.is('element') && disallowedElements.includes(item.name)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks if the selection is within a population.
   */
  private _isSelectionInPopulation(selection: Selection | DocumentSelection): boolean {
    // For empty selection, check adjacent nodes
    if (selection.isCollapsed) {
      const position = selection.getFirstPosition();
      if (!position) return false;

      const nodeBefore = position.nodeBefore;
      const nodeAfter = position.nodeAfter;

      return (nodeBefore && nodeBefore.is('element') && nodeBefore.name === 'populationBegin') ||
        (nodeAfter && nodeAfter.is('element') && nodeAfter.name === 'populationEnd');
    }

    // For non-empty selection, check if it has population markers
    const range = selection.getFirstRange();
    if (!range) return false;

    const walker = range.getWalker({ ignoreElementEnd: true });
    for (const { item } of walker) {
      if (item.is('element') && (item.name === 'populationBegin' || item.name === 'populationEnd')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Inserts empty population tags at the given position.
   * 
   * @param {Writer} writer The model writer.
   * @param {Position} position The position to insert at.
   * @param {string} populationName The name of the population.
   * @returns {Range} The range between the inserted tags.
   */
  private _insertEmptyPopulation(writer: Writer, position: Position, populationName: string): Range {
    let currentPosition = position;

    // Create ahExpr element
    const ahExprElement = writer.createElement('ahExpr', {
      name: populationName,
      class: 'expeSelector',
      title: populationName,
      assettype: 'population'
    });

    // Insert begin marker
    const beginElement = writer.createElement('populationBegin', { name: populationName });
    writer.insert(beginElement, currentPosition);
    currentPosition = writer.createPositionAfter(beginElement);

    // Insert a space
    const spacer = writer.createText(' ');
    writer.insert(spacer, currentPosition);
    currentPosition = writer.createPositionAfter(spacer);

    const beforeEndPosition = currentPosition;

    // Insert end marker
    const endElement = writer.createElement('populationEnd', { name: populationName });
    writer.insert(endElement, currentPosition);

    // Wrap all elements in ahExpr
    const wrapRange = writer.createRange(
      writer.createPositionBefore(beginElement),
      writer.createPositionAfter(endElement)
    );
    writer.wrap(wrapRange, ahExprElement);

    return writer.createRange(
      writer.createPositionAfter(beginElement),
      beforeEndPosition
    );
  }

  /**
   * Adds population tags to the given range.
   * 
   * @param {Writer} writer The model writer.
   * @param {Range} range The range to add population tags to.
   * @param {string} populationName The name of the population.
   */
  private _addPopulationToRange(writer: Writer, range: Range, populationName: string) {
    // Get the start and end positions of the range
    const start = range.start;
    const end = range.end;

    // Create ahExpr element
    const ahExprElement = writer.createElement('ahExpr', {
      name: populationName,
      class: 'expeSelector',
      title: populationName,
      assettype: 'population'
    });

    // Insert begin marker
    const beginElement = writer.createElement('populationBegin', { name: populationName });
    writer.insert(beginElement, start);

    // Insert end marker
    const endElement = writer.createElement('populationEnd', { name: populationName });
    writer.insert(endElement, end);

    // Wrap the range (including markers) in ahExpr
    const wrapRange = writer.createRange(
      writer.createPositionBefore(beginElement),
      writer.createPositionAfter(endElement)
    );
    writer.wrap(wrapRange, ahExprElement);
  }
}

/**
 * Command for removing population tags.
 */
export class RemovePopulationCommand extends Command {
  /**
   * @inheritDoc
   */
  override refresh() {
    // The command can be executed when the selection is inside a population
    const selection = this.editor.model.document.selection;
    this.isEnabled = this._findPopulationTagsInSelection(selection) !== null;
  }

  /**
   * Executes the command to remove population tags.
   */
  override execute() {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // Find population tags in the current selection
      const populationTags = this._findPopulationTagsInSelection(selection);

      if (!populationTags) return;

      // Remove begin and end tags
      writer.remove(populationTags.begin);
      writer.remove(populationTags.end);
    });
  }

  /**
   * Finds population begin and end tags that surround or are part of the selection.
   */
  private _findPopulationTagsInSelection(selection: Selection | DocumentSelection): { begin: Element; end: Element } | null {
    const model = this.editor.model;
    const range = selection.getFirstRange();
    if (!range) return null;

    // Expand range to include the whole document
    const root = range.root;
    const fullRange = model.createRangeIn(root);

    // Find all population begin/end tags in the document
    const populationBeginTags: Element[] = [];
    const populationEndTags: Map<string, Element[]> = new Map();

    const walker = fullRange.getWalker({ ignoreElementEnd: true });
    for (const { item } of walker) {
      if (item.is('element')) {
        if (item.name === 'populationBegin') {
          const name = item.getAttribute('name') as string;
          populationBeginTags.push(item);

          // Initialize the array for this population name if needed
          if (!populationEndTags.has(name)) {
            populationEndTags.set(name, []);
          }
        } else if (item.name === 'populationEnd') {
          const name = item.getAttribute('name') as string;

          if (!populationEndTags.has(name)) {
            populationEndTags.set(name, []);
          }
          populationEndTags.get(name)!.push(item);
        }
      }
    }

    // Check each begin tag to see if it has a matching end tag that surrounds or intersects with the selection
    for (const beginTag of populationBeginTags) {
      const name = beginTag.getAttribute('name') as string;
      const endTagsForName = populationEndTags.get(name) || [];

      for (const endTag of endTagsForName) {
        const beginPos = model.createPositionAfter(beginTag);
        const endPos = model.createPositionBefore(endTag);
        const populationRange = model.createRange(beginPos, endPos);

        // Check if selection intersects with this population range
        if (range.containsRange(populationRange) ||
          populationRange.containsRange(range) ||
          populationRange.containsPosition(range.start) ||
          populationRange.containsPosition(range.end) ||
          range.containsItem(beginTag) ||
          range.containsItem(endTag)) {
          return { begin: beginTag, end: endTag };
        }
      }
    }
    return null;
  }
}

/**
 * Plugin that registers the commands for the AlightPopulationsPlugin.
 */
export default class AlightPopulationPluginCommand extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPopulationPluginCommand';
  }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Register the Add Population command
    editor.commands.add('alightPopulationPlugin', new AddPopulationCommand(editor));

    // Register the Remove Population command
    editor.commands.add('removePopulation', new RemovePopulationCommand(editor));
  }
}
