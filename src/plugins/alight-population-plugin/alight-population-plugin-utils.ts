// src/plugins/alight-population-plugin/alight-population-plugin-utils.ts
import type {
  Writer,
  Model,
  Range,
  Node,
  DocumentSelection,
  Selection,
  Position,
  Text,
  TextProxy,
  Element as ModelElement,
  DocumentFragment
} from '@ckeditor/ckeditor5-engine';

/**
 * Interface representing population tag elements.
 */
export interface PopulationTags {
  begin: ModelElement;
  end: ModelElement;
  populationName: string;
}

/**
 * Checks if a selection is within a population.
 * This is used by the UI to determine if the Remove Population button should be enabled.
 * 
 * @param {Selection|DocumentSelection} selection The selection to check.
 * @returns {boolean} Whether the selection is within a population.
 */
export function isSelectionInPopulation(selection: Selection | DocumentSelection): boolean {
  if (!selection) return false;

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
 * Gets population information at a given position.
 * 
 * @param {Position} position The position to check.
 * @returns {Object|null} Population info or null if not in a population.
 */
export function getPopulationAtPosition(position: Position): { name: string } | null {
  if (!position) return null;

  // Get the node at the position
  const nodeAfter = position.nodeAfter;
  const nodeBefore = position.nodeBefore;

  // Check if the node is a population tag element
  if (nodeAfter && nodeAfter.is('element') && nodeAfter.name === 'populationBegin') {
    return {
      name: String(nodeAfter.getAttribute('name') || '')
    };
  }

  if (nodeBefore && nodeBefore.is('element') && nodeBefore.name === 'populationEnd') {
    return {
      name: String(nodeBefore.getAttribute('name') || '')
    };
  }

  return null;
}

/**
 * Finds population tags in a selection range.
 * Used by the RemovePopulationCommand to find and remove population tags.
 * 
 * @param {Selection|DocumentSelection} selection The selection to check.
 * @param {Model} model The editor model.
 * @returns {PopulationTags|null} The population tags or null if not found.
 */
export function findPopulationTagsInRange(
  selection: Selection | DocumentSelection,
  model: Model
): PopulationTags | null {
  if (!selection || !model) return null;

  const range = selection.getFirstRange();
  if (!range) return null;

  // Expand range to include the whole document
  const root = range.root;
  const fullRange = model.createRangeIn(root);

  // Find all population begin/end tags in the document
  const populationBeginTags: ModelElement[] = [];
  const populationEndTags: Map<string, ModelElement[]> = new Map();

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

        // Add this end tag to the array for its name
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

      try {
        const populationRange = model.createRange(beginPos, endPos);

        // Check if selection intersects with this population range
        if (range.containsRange(populationRange) ||
          populationRange.containsRange(range) ||
          populationRange.containsPosition(range.start) ||
          populationRange.containsPosition(range.end) ||
          range.containsItem(beginTag) ||
          range.containsItem(endTag)) {
          return {
            begin: beginTag,
            end: endTag,
            populationName: name
          };
        }
      } catch (error) {
        console.error('Error checking range intersection:', error);
        continue;
      }
    }
  }

  return null;
}
