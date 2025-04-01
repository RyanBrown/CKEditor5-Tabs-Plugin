// src/plugins/alight-population-plugin/alight-population-plugin-command.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Command } from '@ckeditor/ckeditor5-core';
import type { Writer } from '@ckeditor/ckeditor5-engine';
import type { Element, Range, Selection, DocumentSelection, Position } from '@ckeditor/ckeditor5-engine';
import { findPopulationTagsInRange, isSelectionInPopulation, createPopulationTags } from './alight-population-plugin-utils';

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
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If there's no selection, insert empty population tags at the cursor position
      if (selection.isCollapsed) {
        const position = selection.getFirstPosition()!;
        const emptyPopulationRange = this._insertEmptyPopulation(writer, position, populationName);

        // Set selection between the tags
        writer.setSelection(emptyPopulationRange);
        return;
      }

      // If there's an existing population in the selection, remove it first
      if (isSelectionInPopulation(selection)) {
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
   * Inserts empty population tags at the given position.
   * 
   * @param {Writer} writer The model writer.
   * @param {Position} position The position to insert at.
   * @param {string} populationName The name of the population.
   * @returns {Range} The range between the inserted tags.
   */
  private _insertEmptyPopulation(writer: Writer, position: Position, populationName: string) {
    // Create markers for population begin and end
    const beginAttr = {
      'population-tag': 'begin',
      'population-name': populationName
    };

    const endAttr = {
      'population-tag': 'end',
      'population-name': populationName
    };

    // Insert begin marker
    const beginElement = writer.createText('[BEGIN *' + populationName + '*]', beginAttr);
    writer.insert(beginElement, position);

    // Insert a space between markers
    const spacer = writer.createText(' ');
    writer.insert(spacer, position);

    // Insert end marker
    const endElement = writer.createText('[*' + populationName + '* END]', endAttr);
    writer.insert(endElement, position);

    // Return the range between the markers
    return writer.createRange(
      writer.createPositionAfter(beginElement),
      writer.createPositionBefore(endElement)
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

    // Create the population tags
    const { begin, end: endTag } = createPopulationTags(writer, populationName);

    // Insert the tags at the appropriate positions
    writer.insert(begin, start);
    writer.insert(endTag, end);
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
    this.isEnabled = isSelectionInPopulation(selection);
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
      const populationTags = findPopulationTagsInRange(selection, model);

      if (!populationTags) return;

      // Remove begin and end tags
      writer.remove(populationTags.begin);
      writer.remove(populationTags.end);
    });
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