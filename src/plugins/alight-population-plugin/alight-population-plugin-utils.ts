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
  begin: Node;
  end: Node;
  populationName: string;
}

/**
 * Checks if a selection is within a population.
 * 
 * @param {Selection|DocumentSelection} selection The selection to check.
 * @returns {boolean} Whether the selection is within a population.
 */
export function isSelectionInPopulation(selection: Selection | DocumentSelection): boolean {
  if (selection.isCollapsed) {
    // Check if the cursor position has population tags
    return !!getPopulationAtPosition(selection.getFirstPosition()!);
  }

  // For non-collapsed selection, check if the range has population tags
  for (const range of selection.getRanges()) {
    // Check if any node in the range has population attributes
    const walker = range.getWalker({ ignoreElementEnd: true });

    for (const { item } of walker) {
      if ('hasAttribute' in item && item.hasAttribute('population-tag')) {
        return true;
      }
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
  // Get the node at the position
  const node = position.textNode || position.nodeAfter || position.nodeBefore;

  if (!node) return null;

  // Check if the node has population attributes
  if ('hasAttribute' in node && node.hasAttribute('population-tag') && node.hasAttribute('population-name')) {
    return {
      name: String(node.getAttribute('population-name'))
    };
  }

  // Check for population tags in parent nodes
  let parent = node.parent;
  while (parent) {
    if ('hasAttribute' in parent && parent.hasAttribute('population-tag') && parent.hasAttribute('population-name')) {
      return {
        name: String(parent.getAttribute('population-name'))
      };
    }
    parent = parent.parent;
  }

  return null;
}

/**
 * Gets all population ranges in the document.
 * 
 * @param {Model} model The editor model.
 * @returns {Array<PopulationTags>} Array of population tag ranges.
 */
function getPopulationRangesInDocument(model: Model): PopulationTags[] {
  const result: PopulationTags[] = [];
  const doc = model.document;
  const beginTags: Map<string, Node[]> = new Map();

  // Iterate through all roots in the document
  for (const rootName of doc.getRootNames()) {
    const root = doc.getRoot(rootName)!;
    const range = model.createRangeIn(root);
    const walker = range.getWalker({ ignoreElementEnd: true });

    // Find all population tags
    for (const { item } of walker) {
      if (!item.is('$text') && !item.is('$textProxy')) continue;

      // Check if this node is a population tag
      if ('hasAttribute' in item && item.hasAttribute('population-tag') && item.hasAttribute('population-name')) {
        const tagType = String(item.getAttribute('population-tag'));
        const populationName = String(item.getAttribute('population-name'));

        if (tagType === 'begin') {
          // Store begin tags in a map keyed by population name
          if (!beginTags.has(populationName)) {
            beginTags.set(populationName, []);
          }
          beginTags.get(populationName)!.push(item as unknown as Node);
        } else if (tagType === 'end') {
          // Find matching begin tag for this end tag
          const beginTagsArray = beginTags.get(populationName) || [];
          const beginTag = beginTagsArray.pop();

          if (beginTag) {
            // Found a matching pair
            result.push({
              begin: beginTag,
              end: item as unknown as Node,
              populationName
            });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Creates population tag elements for inserting into the model.
 * 
 * @param {Writer} writer The model writer.
 * @param {string} populationName The name of the population.
 * @returns {Object} The begin and end tag elements.
 */
export function createPopulationTags(writer: Writer, populationName: string) {
  // Create the begin tag
  const beginTag = writer.createText('[BEGIN *' + populationName + '*]', {
    'population-tag': 'begin',
    'population-name': populationName
  });

  // Create the end tag
  const endTag = writer.createText('[*' + populationName + '* END]', {
    'population-tag': 'end',
    'population-name': populationName
  });

  return {
    begin: beginTag,
    end: endTag
  };
}

/**
 * Gets the parent element of a given node that matches specified criteria.
 * 
 * @param {Node} node The node to start from.
 * @param {Function} callback A predicate function to test each parent.
 * @returns {Node|null} The found parent or null.
 */
export function findParent(node: Node, callback: (node: Node) => boolean): Node | null {
  if (!node || !node.parent) return null;

  let parent = node.parent;

  while (parent) {
    if (callback(parent)) {
      return parent;
    }
    parent = parent.parent;
  }

  return null;
}

/**
 * Checks if a node is inside a population.
 * 
 * @param {Node} node The node to check.
 * @returns {boolean} Whether the node is inside a population.
 */
export function isNodeInPopulation(node: Node): boolean {
  // Check if the node itself has population tag attributes
  if ('hasAttribute' in node && node.hasAttribute('population-tag')) {
    return true;
  }

  // Check if any parent has population tag attributes
  return !!findParent(node, parent =>
    'hasAttribute' in parent && parent.hasAttribute('population-tag')
  );
}

/**
 * Finds population tags in a selection range.
 * 
 * @param {Selection|DocumentSelection} selection The selection to check.
 * @param {Model} model The editor model.
 * @returns {PopulationTags|null} The population tags or null if not found.
 */
export function findPopulationTagsInRange(
  selection: Selection | DocumentSelection,
  model: Model
): PopulationTags | null {
  // Get all population tags in the document
  const populationRanges = getPopulationRangesInDocument(model);

  // Get the selection range
  const selectionRange = selection.getFirstRange();
  if (!selectionRange) return null;

  // Find the population tags that contain the selection
  for (const { begin, end, populationName } of populationRanges) {
    // Create a range between the begin and end tags
    const beginPos = model.createPositionAfter(begin);
    const endPos = model.createPositionBefore(end);
    const populationRange = model.createRange(beginPos, endPos);

    // Check if the selection is within the population range
    if ((selectionRange.start.isAfter(beginPos) && selectionRange.end.isBefore(endPos)) ||
      selectionRange.containsItem(begin) || selectionRange.containsItem(end)) {
      return {
        begin,
        end,
        populationName
      };
    }
  }

  return null;
}