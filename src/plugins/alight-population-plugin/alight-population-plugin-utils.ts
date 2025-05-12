// src/plugins/alight-population-plugin/alight-population-plugin-utils.ts
import type {
  Model,
  DocumentSelection,
  Selection,
  Position,
  Element as ModelElement
} from '@ckeditor/ckeditor5-engine';

/**
 * Interface representing population tag elements.
 */
export interface PopulationTags {
  begin: ModelElement;
  end: ModelElement;
  populationName: string;
  populationId?: string;
  ahExpr?: ModelElement;
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

    // Check if selection is within a population tag
    if ((nodeBefore && nodeBefore.is('element') && nodeBefore.name === 'populationBegin') ||
      (nodeAfter && nodeAfter.is('element') && nodeAfter.name === 'populationEnd')) {
      return true;
    }

    // Check if any ancestor is an ahExpr element
    const ancestors = position.getAncestors();
    return !!ancestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr');
  }

  // For non-empty selection, check if it has population markers or is in an ahExpr
  const range = selection.getFirstRange();
  if (!range) return false;

  // Check if selection contains population markers
  const walker = range.getWalker({ ignoreElementEnd: true });
  for (const { item } of walker) {
    if (item.is('element') && (item.name === 'populationBegin' || item.name === 'populationEnd' || item.name === 'ahExpr')) {
      return true;
    }
  }

  // Check if selection is within an ahExpr
  const startAncestors = range.start.getAncestors();
  const endAncestors = range.end.getAncestors();

  return !!(startAncestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr') ||
    endAncestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr'));
}

/**
 * Gets population information at a given position.
 * 
 * @param {Position} position The position to check.
 * @returns {Object|null} Population info or null if not in a population.
 */
export function getPopulationAtPosition(position: Position): { name: string; populationId?: string } | null {
  if (!position) return null;

  // Get the node at the position
  const nodeAfter = position.nodeAfter;
  const nodeBefore = position.nodeBefore;

  // Check if the node is a population tag element
  if (nodeAfter && nodeAfter.is('element') && nodeAfter.name === 'populationBegin') {
    return {
      name: String(nodeAfter.getAttribute('name') || ''),
      populationId: nodeAfter.getAttribute('populationId') as string
    };
  }

  if (nodeBefore && nodeBefore.is('element') && nodeBefore.name === 'populationEnd') {
    return {
      name: String(nodeBefore.getAttribute('name') || ''),
      populationId: nodeBefore.getAttribute('populationId') as string
    };
  }

  // Check if any ancestor is an ahExpr element
  const ancestors = position.getAncestors();
  const ahExpr = ancestors.find(ancestor =>
    ancestor.is('element') && ancestor.name === 'ahExpr'
  );

  if (ahExpr && ahExpr.is('element')) {
    const name = ahExpr.getAttribute('name');
    const populationId = ahExpr.getAttribute('populationId');

    return {
      name: name ? String(name) : '',
      populationId: populationId as string | undefined
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

  // First check if the selection is inside an ahExpr element
  const startAncestors = range.start.getAncestors();
  const endAncestors = range.end.getAncestors();

  // Find ahExpr in ancestors
  const ahExpr = startAncestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr') ||
    endAncestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr');

  if (ahExpr) {
    // Find begin and end tags inside the ahExpr
    let beginTag: ModelElement | null = null;
    let endTag: ModelElement | null = null;

    // Create a range in the ahExpr and find the tags
    const ahExprRange = model.createRangeIn(ahExpr);
    const walker = ahExprRange.getWalker({ ignoreElementEnd: true });

    for (const { item } of walker) {
      if (item.is('element')) {
        if (item.name === 'populationBegin') {
          beginTag = item;
        } else if (item.name === 'populationEnd') {
          endTag = item;
        }
      }
    }

    if (beginTag && endTag) {
      return {
        begin: beginTag,
        end: endTag,
        populationName: String(beginTag.getAttribute('name') || ''),
        populationId: beginTag.getAttribute('populationId') as string,
        ahExpr: ahExpr as ModelElement
      };
    }
  }

  // If not found in ahExpr, expand range to include the whole document
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
    const populationId = beginTag.getAttribute('populationId') as string;
    const endTagsForName = populationEndTags.get(name) || [];

    for (const endTag of endTagsForName) {
      // Find the parent ahExpr for this begin tag if it exists
      const ancestors = beginTag.getAncestors();
      const ahExprParent = ancestors.find(ancestor => ancestor.is('element') && ancestor.name === 'ahExpr') as ModelElement | undefined;

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
            populationName: name,
            populationId: populationId,
            ahExpr: ahExprParent
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
