// src/plugins/alight-prevent-link-nesting-plugin/utils.ts
/**
 * Utilities for the prevent link nesting plugin
 */

/**
 * Finds all link attributes from a text node
 * 
 * @param node The text node to check
 * @param linkAttributes Array of possible link attribute names
 * @returns Object with attribute names as keys and their values
 */
export function getLinkAttributesFromNode(node: any, linkAttributes: string[]): Record<string, any> {
  const result: Record<string, any> = {};

  if (node && node.is && node.is('$text')) {
    for (const attr of linkAttributes) {
      if (node.hasAttribute(attr)) {
        result[attr] = node.getAttribute(attr);
      }
    }
  }

  return result;
}

/**
* Determines if a node is inside a link
* 
* @param node The node to check
* @param linkAttributes Array of link attribute names to check
* @returns True if the node is inside a link, false otherwise
*/
export function isNodeInsideLink(node: any, linkAttributes: string[]): boolean {
  if (!node || !node.parent) {
    return false;
  }

  let ancestor = node.parent;

  while (ancestor && !ancestor.is('rootElement')) {
    // Check if this ancestor has any text nodes with link attributes
    const textNodesWithLinks = Array.from(ancestor.getChildren() as any[]).filter(
      (child: any) => child.is && child.is('$text') && linkAttributes.some(
        (attr: string) => child.hasAttribute && child.hasAttribute(attr)
      )
    );

    if (textNodesWithLinks.length > 0) {
      return true;
    }

    // Move up to next ancestor
    ancestor = ancestor.parent;
  }

  return false;
}
