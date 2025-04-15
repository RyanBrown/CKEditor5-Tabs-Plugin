// src/plugins/alight-email-link-plugin/utils.ts
import type {
  DowncastConversionApi,
  Element,
  Schema,
  ViewAttributeElement,
  ViewNode,
  ViewDocumentFragment
} from '@ckeditor/ckeditor5-engine';

import type { Editor } from '@ckeditor/ckeditor5-core';
import type { LocaleTranslate } from '@ckeditor/ckeditor5-utils';
import type { BookmarkEditing } from '@ckeditor/ckeditor5-bookmark';

import type {
  LinkDecoratorAutomaticDefinition,
  LinkDecoratorDefinition,
  LinkDecoratorManualDefinition
} from './linkconfig';

import type { LinkActionsViewOptions } from './ui/linkactionsview';

import { upperFirst } from 'lodash-es';

const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex

// SAFE_URL_TEMPLATE to only allow http and https protocols
const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';

// Enhanced email detection regex
const ENHANCED_EMAIL_REG_EXP = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the link ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'mailto'
];

/**
 * Returns `true` if a given view node is the link element.
 */
export function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  return node.is('attributeElement') && !!node.getCustomProperty('alight-email-link');
}

// Helper function to detect legacy link types
export function isLegacyEditorLink(url: string): boolean {
  return url.includes('~public_editor_id') || url.includes('~intranet_editor_id');
}

/**
 * Creates a link {@link module:engine/view/attributeelement~AttributeElement} with the provided `href` attribute.
 * Adds the organization name attribute if it exists in the model or can be extracted from text content.
 * Handles non-breaking spaces and special characters in organization names.
 */
export function createLinkElement(href: string, { writer, attrs = {}, item }: DowncastConversionApi & { attrs?: Record<string, string>; item?: any }): ViewAttributeElement {
  // Start with default attributes
  const attributes: Record<string, string> = {
    href,
    'data-id': 'email_link',
    ...attrs
  };

  // If no orgnameattr was provided but the text has format "text (org name)", extract the org name
  if (!attributes.orgnameattr && item) {
    // First, check if the item has the organization attribute
    if (item.hasAttribute && item.hasAttribute('alightEmailLinkPluginOrgName')) {
      attributes.orgnameattr = item.getAttribute('alightEmailLinkPluginOrgName');
    }
    // If not, try to extract from text content
    else if (item.is && item.is('$text') && item.data) {
      // Replace any non-breaking spaces with regular spaces for consistency
      const itemData = item.data.replace(/\u00A0/g, ' ');
      const match = itemData.match(/^(.*?)\s+\(([^)]+)\)$/);
      if (match && match[2]) {
        attributes.orgnameattr = match[2];
      }
    }
    // For selection or other types, try to find organization in parent or related text
    else if (item.getFirstPosition) {
      // Try to get organization from the selected position
      const position = item.getFirstPosition();
      if (position && position.textNode) {
        // Check if the text node at the position has the organization attribute
        if (position.textNode.hasAttribute('alightEmailLinkPluginOrgName')) {
          attributes.orgnameattr = position.textNode.getAttribute('alightEmailLinkPluginOrgName');
        }
        // If not, try to extract from text
        else if (position.textNode.data) {
          // Clean text data by replacing non-breaking spaces
          const textData = position.textNode.data.replace(/\u00A0/g, ' ');
          const match = textData.match(/^(.*?)\s+\(([^)]+)\)$/);
          if (match && match[2]) {
            attributes.orgnameattr = match[2];
          }
        }
      }
    }
  }

  // Priority 5 - https://github.com/ckeditor/ckeditor5-link/issues/121.
  const linkElement = writer.createAttributeElement('a', attributes, { priority: 5 });

  writer.setCustomProperty('alight-email-link', true, linkElement);

  return linkElement;
}

/**
 * Returns a safe URL based on a given value.
 *
 * A URL is considered safe if it is safe for the user (does not contain any malicious code).
 * Only http and https protocols are allowed.
 *
 * If a URL is considered unsafe, a simple `"#"` is returned.
 *
 * @internal
 */
export function ensureSafeUrl(url: unknown, allowedProtocols: Array<string> = DEFAULT_LINK_PROTOCOLS): string {
  const urlString = String(url);

  const protocolsList = allowedProtocols.join('|');
  const customSafeRegex = new RegExp(`${SAFE_URL_TEMPLATE.replace('<protocols>', protocolsList)}`, 'i');

  return isSafeUrl(urlString, customSafeRegex) ? urlString : '#';
}

/**
 * Checks whether the given URL is safe for the user (does not contain any malicious code).
 */
function isSafeUrl(url: string, customRegexp: RegExp): boolean {
  const normalizedUrl = url.replace(ATTRIBUTE_WHITESPACES, '');

  return !!normalizedUrl.match(customRegexp);
}

/**
 * Returns the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration processed
 * to respect the locale of the editor, i.e. to display the {@link module:link/linkconfig~LinkDecoratorManualDefinition label}
 * in the correct language.
 *
 * **Note**: Only the few most commonly used labels are translated automatically. Other labels should be manually
 * translated in the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration.
 *
 * @param t Shorthand for {@link module:utils/locale~Locale#t Locale#t}.
 * @param decorators The decorator reference where the label values should be localized.
 */
export function getLocalizedDecorators(
  t: LocaleTranslate,
  decorators: Array<NormalizedLinkDecoratorDefinition>
): Array<NormalizedLinkDecoratorDefinition> {
  const localizedDecoratorsLabels: Record<string, string> = {
    'Open in a new tab': t('Open in a new tab'),
    'Downloadable': t('Downloadable')
  };

  decorators.forEach(decorator => {
    if ('label' in decorator && localizedDecoratorsLabels[decorator.label]) {
      decorator.label = localizedDecoratorsLabels[decorator.label];
    }

    return decorator;
  });

  return decorators;
}

/**
 * Converts an object with defined decorators to a normalized array of decorators. The `id` key is added for each decorator and
 * is used as the attribute's name in the model.
 */
export function normalizeDecorators(decorators?: Record<string, LinkDecoratorDefinition>): Array<NormalizedLinkDecoratorDefinition> {
  const retArray: Array<NormalizedLinkDecoratorDefinition> = [];

  if (decorators) {
    for (const [key, value] of Object.entries(decorators)) {
      const decorator = Object.assign(
        {},
        value,
        { id: `link${upperFirst(key)}` }
      );

      retArray.push(decorator);
    }
  }

  return retArray;
}

/**
 * Returns `true` if the specified `element` can be linked (the element allows the `alightEmailLinkPluginHref` attribute).
 */
export function isLinkableElement(element: Element | null, schema: Schema): element is Element {
  if (!element) {
    return false;
  }

  return schema.checkAttribute(element.name, 'alightEmailLinkPluginHref');
}

/**
 * Returns `true` if the specified `value` is an email.
 */
export function isEmail(value: string): boolean {
  // First check if it's already a mailto: link
  if (value.startsWith('mailto:')) {
    // Validate the part after mailto:
    return ENHANCED_EMAIL_REG_EXP.test(value.substring(7));
  }

  // Then check if it looks like an email address with the enhanced pattern
  return ENHANCED_EMAIL_REG_EXP.test(value);
}

/**
 * Adds the protocol prefix to the specified `link` when:
 * 
 * it does not contain it already, and there is a {@link module:link/linkconfig~LinkConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided, or the link is an email address.
 */
export function addLinkProtocolIfApplicable(link: string, defaultProtocol?: string): string {
  // For emails, ensure mailto: is always added
  if (isEmail(link) && !link.startsWith('mailto:')) {
    return 'mailto:' + link;
  }

  const protocol = isEmail(link) ? 'mailto:' : defaultProtocol;
  const isProtocolNeeded = !!protocol && !linkHasProtocol(link);

  return link && isProtocolNeeded ? protocol + link : link;
}

/**
 * Checks if protocol is already included in the link.
 */
export function linkHasProtocol(link: string): boolean {
  return PROTOCOL_REG_EXP.test(link);
}

/**
 * Opens the link in a new browser tab.
 */
export function openLink(link: string): void {
  window.open(link, '_blank', 'noopener');
}

/**
 * Creates the bookmark callbacks for handling link opening experience.
 */
export function createBookmarkCallbacks(editor: Editor): LinkActionsViewOptions {
  const bookmarkEditing: BookmarkEditing | null = editor.plugins.has('BookmarkEditing') ?
    editor.plugins.get('BookmarkEditing') :
    null;

  /**
   * Returns `true` when bookmark `id` matches the hash from `link`.
   */
  function isScrollableToTarget(link: string | undefined): boolean {
    return !!link &&
      link.startsWith('#') &&
      !!bookmarkEditing &&
      !!bookmarkEditing.getElementForBookmarkId(link.slice(1));
  }

  /**
   * Scrolls the view to the desired bookmark or open a link in new window.
   */
  function scrollToTarget(link: string): void {
    const bookmarkId = link.slice(1);
    const modelBookmark = bookmarkEditing!.getElementForBookmarkId(bookmarkId);

    editor.model.change(writer => {
      writer.setSelection(modelBookmark!, 'on');
    });

    editor.editing.view.scrollToTheSelection({
      alignToTop: true,
      forceScroll: true
    });
  }

  return {
    isScrollableToTarget,
    scrollToTarget
  };
}

/**
 * Converts a string to a valid mailto link if it's an email address
 */
export function ensureMailtoLink(value: string): string {
  // If it's already a mailto link, return as is
  if (value.startsWith('mailto:')) {
    return value;
  }

  // If it's an email address, add mailto:
  if (isEmail(value)) {
    return 'mailto:' + value;
  }

  // Otherwise return the original string
  return value;
}

/**
 * Extracts email address from a mailto link
 */
export function extractEmail(mailtoLink: string): string {
  if (mailtoLink.startsWith('mailto:')) {
    return mailtoLink.substring(7);
  }
  return mailtoLink;
}

/**
 * Extracts organization name from a link text that has format "email (organization)"
 */
export function extractOrganization(linkText: string): string | null {
  const match = linkText.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

/**
 * Formats email with organization
 */
export function formatEmailWithOrganization(email: string, organization: string | null): string {
  if (!organization) {
    return email;
  }
  return `${email} (${organization})`;
}

/**
 * Checks if a URL is a mailto link
 */
export function isMailtoLink(url: string): boolean {
  return url.startsWith('mailto:');
}

/**
 * Extracts the organization name from a link text.
 * @param text The link text to extract from
 * @returns The organization name or null if none found
 */
export function extractOrganizationName(text: string): string | null {
  if (!text) return null;

  // Match pattern like "text (Organization Name)" where the organization is in parentheses
  const match = text.match(/^(.*?)\s+\(([^)]+)\)$/);
  if (match && match[2]) {
    return match[2];
  }
  return null;
}

/**
 * Combines text with an organization name
 * @param text The base text
 * @param organization The organization name to add
 * @returns Text with organization in parentheses
 */
export function addOrganizationToText(text: string, organization: string | null | undefined): string {
  if (!text) return '';
  if (!organization) return text;

  return `${text} (${organization})`;
}

/**
 * Removes the organization name from link text
 * @param text The text with possible organization name
 * @returns Text without organization
 */
export function removeOrganizationFromText(text: string): string {
  if (!text) return '';

  // Remove the organization part which is in parentheses at the end
  return text.replace(/\s+\([^)]+\)$/, '');
}

/**
 * Gets only the domain part from a URL
 * @param url The URL to process
 * @returns Simplified domain display
 */
export function getDomainForDisplay(url: string): string {
  if (!url) return '';

  // Remove protocol
  let domain = url.replace(/^https?:\/\//, '');

  // Remove paths, query params, etc.
  const firstSlash = domain.indexOf('/');
  if (firstSlash > 0) {
    domain = domain.substring(0, firstSlash);
  }

  // If domain starts with www., remove it for cleaner display
  domain = domain.replace(/^www\./, '');

  return domain;
}

/**
 * Creates a formatted display text for links with optional organization
 * @param url The URL to format
 * @param organization Optional organization name
 * @returns Formatted display text
 */
export function createLinkDisplayText(url: string, organization?: string): string {
  const domain = getDomainForDisplay(url);

  if (organization) {
    return addOrganizationToText(domain, organization);
  }

  return domain;
}

/**
 * Extracts and applies the organization name attribute to links that have the format "text (org name)"
 * but don't already have the orgnameattr attribute
 * 
 * @param textNode The text node to process
 * @param writer The writer to use for making changes
 * @returns The organization name if found, or undefined if not found
 */
export function extractAndApplyOrganizationName(textNode: any, writer: any): string | undefined {
  // Skip if not a text node
  if (!textNode || !textNode.is || !textNode.is('$text')) {
    return undefined;
  }

  // Check if the node already has an organization name attribute
  if (textNode.hasAttribute('alightEmailLinkPluginOrgName')) {
    return textNode.getAttribute('alightEmailLinkPluginOrgName');
  }

  // Try to extract from text content
  const textData = textNode.data;
  if (!textData) {
    return undefined;
  }

  // Look for text format "text (org name)"
  const match = textData.match(/^(.*?)\s+\(([^)]+)\)$/);
  if (match && match[2]) {
    const orgName = match[2];

    // If found, apply it to the text node
    if (writer) {
      writer.setAttribute('alightEmailLinkPluginOrgName', orgName, textNode);
    }

    return orgName;
  }

  return undefined;
}

// Add these utility functions to src/plugins/alight-email-link-plugin/utils.ts

import type { Writer, Node, Position } from '@ckeditor/ckeditor5-engine';

/**
 * Collects formatting attributes from text nodes
 * @param nodes The text nodes to collect attributes from
 * @param excludeAttributes Attribute names to exclude from collection
 * @returns Object with collected attributes
 */
export function collectFormattingAttributes(
  nodes: Array<any>,  // Changed from Node to any to fix type errors
  excludeAttributes: string[] = []
): Record<string, unknown> {
  if (!nodes.length) return {};

  const attributes: Record<string, unknown> = {};
  const firstNode = nodes[0];

  // Verify the node has getAttributes method before using it
  if (firstNode && typeof firstNode.getAttributes === 'function') {
    // Get attributes from the first node as baseline
    for (const [key, value] of firstNode.getAttributes()) {
      if (!excludeAttributes.includes(key)) {
        attributes[key] = value;
      }
    }
  }

  return attributes;
}

/**
 * Preserves formatting when replacing text in a range
 * @param writer The writer instance
 * @param range The range to replace text in
 * @param newText The new text content
 * @param excludeAttributes Attributes to exclude when copying formatting
 * @returns Position after the inserted text
 */
export function replaceTextPreservingFormatting(
  writer: Writer,
  range: any,
  newText: string,
  excludeAttributes: string[] = []
): Position {
  // Get all text nodes in the range
  const textNodes = Array.from(range.getItems()).filter(
    (item: any) => item && (
      (typeof item.is === 'function' && (item.is('$text') || item.is('$textProxy')))
    )
  );

  // Collect formatting attributes from existing nodes
  const formattingAttributes = collectFormattingAttributes(textNodes, excludeAttributes);

  // Remove all existing nodes first
  writer.remove(range);

  // Create and insert new text with preserved formatting
  const newTextNode = writer.createText(newText, formattingAttributes);
  writer.insert(newTextNode, range.start);

  // Return position after the inserted text
  return writer.createPositionAt(
    range.start.parent,
    range.start.offset + newText.length
  );
}

/**
 * Updates link text with organization while preserving formatting
 * @param writer The writer instance
 * @param range The range of the link text
 * @param baseText The base text without organization
 * @param organization Optional organization to add
 * @param excludeAttributes Attributes to exclude when preserving formatting
 * @returns Position after the inserted text
 */
export function updateLinkTextWithOrganization(
  writer: Writer,
  range: any,
  baseText: string,
  organization?: string,
  excludeAttributes: string[] = ['alightEmailLinkPluginHref']
): Position {
  let finalText = baseText;
  if (organization) {
    finalText = addOrganizationToText(baseText, organization);
  }

  return replaceTextPreservingFormatting(writer, range, finalText, excludeAttributes);
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
