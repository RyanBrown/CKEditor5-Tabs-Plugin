// src/plugins/alight-predefined-link-plugin/utils.ts
import type {
  DowncastConversionApi,
  Element,
  Node as ModelNode,
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
const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'https?',
  'ftps?',
];

// Predefined link identifier pattern - detect links with various ID formats
const PREDEFINED_LINK_PATTERN = /^(id:|name:|#[\w-]+|[\w-]+)$/i;

/**
 * Returns `true` if a given view node is the link element.
 */
export function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  if (!node) {
    return false;
  }

  // Check if it's an attributeElement first
  if (!node.is || typeof node.is !== 'function') {
    return false;
  }

  try {
    if (!node.is('attributeElement')) {
      return false;
    }

    // Check if it has the custom property or specific classes/attributes
    return !!(
      (node.getCustomProperty && node.getCustomProperty('alight-predefined-link')) ||
      (typeof node.hasClass === 'function' && node.hasClass('AHCustomeLink')) ||
      (node.getAttribute && node.getAttribute('data-id') === 'predefined_link')
    );
  } catch (e) {
    console.error('Error in isLinkElement check:', e);
    return false;
  }
}

/**
 * Helper function to detect predefined links
 * For testing purposes, let's make this more aggressive in detection
 */
export function isPredefinedLink(url: string | null | undefined): boolean {
  if (!url) return false;

  // For debugging - log what we're checking
  console.log('Checking if predefined link:', url);

  // Check if URL matches a predefined link pattern
  if (PREDEFINED_LINK_PATTERN.test(url)) {
    console.log('Matched PREDEFINED_LINK_PATTERN');
    return true;
  }

  // Check for known predefined link prefixes
  const knownPrefixes = ['predefined:', 'internal:', 'link:', 'id:', 'name:'];
  for (const prefix of knownPrefixes) {
    if (url.toLowerCase().startsWith(prefix.toLowerCase())) {
      console.log('Matched known prefix:', prefix);
      return true;
    }
  }

  // Check for data-link-format or data-id attributes in HTML string format
  if (url.includes('data-link-format="ahcustom"') ||
    url.includes('data-id="predefined_link"') ||
    url.includes('class="AHCustomeLink"')) {
    console.log('Matched HTML attributes');
    return true;
  }

  // Check for ah:link tag pattern
  if (url.includes('<ah:link') && url.includes('</ah:link>')) {
    console.log('Matched ah:link pattern');
    return true;
  }

  // If the URL is already in the editor's model structure with the format attribute,
  // we might have the presence of attribute markers
  if (url.startsWith('ahcustom:') || url.includes('ahcustom')) {
    console.log('Matched ahcustom pattern');
    return true;
  }

  // TEMPORARY: For testing, let's treat any string that doesn't look like a URL as predefined
  // This helps with debugging - you can remove this later
  if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('#')) {
    console.log('Treating as predefined link (not a standard URL)');
    return true;
  }

  console.log('Not a predefined link');
  return false;
}

/**
 * Creates a link AttributeElement with the provided `href` attribute.
 */
export function createLinkElement(href: string, { writer }: DowncastConversionApi): ViewAttributeElement {
  // Check if this is a predefined link
  const isPredefined = isPredefinedLink(href);
  const linkId = isPredefined ? extractPredefinedLinkId(href) : null;

  // Create attributes
  const attributes: Record<string, string> = {
    'href': href || '#'
  };

  // Add predefined link attributes
  if (isPredefined) {
    attributes['class'] = 'AHCustomeLink';
    attributes['data-id'] = 'predefined_link';
    if (linkId) {
      attributes['data-link-name'] = linkId;
    }
    attributes['data-link-format'] = 'ahcustom';
  }

  // Create the link element as an attribute element with required attributes
  const linkElement = writer.createAttributeElement('a', attributes, {
    priority: 5,
    id: isPredefined ? 'predefined-link' : 'link'
  });

  // Set custom property for link identification
  writer.setCustomProperty('alight-predefined-link', true, linkElement);

  return linkElement;
}

/**
 * Returns a safe URL based on a given value.
 */
export function ensureSafeUrl(url: unknown, allowedProtocols: Array<string> = DEFAULT_LINK_PROTOCOLS): string {
  const urlString = String(url);

  // For predefined links, return unmodified
  if (isPredefinedLink(urlString)) {
    return urlString;
  }

  // Check if the protocol is allowed
  for (const protocol of allowedProtocols) {
    if (urlString.toLowerCase().startsWith(`${protocol}:`)) {
      return urlString;
    }
  }

  // Check if URL is safe using regex
  const protocolsList = allowedProtocols.join('|');
  const customSafeRegex = new RegExp(`${SAFE_URL_TEMPLATE.replace('<protocols>', protocolsList)}`, 'i');

  return isSafeUrl(urlString, customSafeRegex) ? urlString : '#';
}

/**
 * Checks whether the given URL is safe for the user.
 */
function isSafeUrl(url: string, customRegexp: RegExp): boolean {
  // Consider predefined links safe
  if (isPredefinedLink(url)) {
    return true;
  }

  const normalizedUrl = url.replace(ATTRIBUTE_WHITESPACES, '');
  return !!normalizedUrl.match(customRegexp);
}

/**
 * Returns the configuration processed to respect the locale of the editor.
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
  });

  return decorators;
}

/**
 * Converts an object with defined decorators to a normalized array of decorators.
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
 * Returns `true` if the specified `element` can be linked.
 */
export function isLinkableElement(element: Element | null, schema: Schema): element is Element {
  if (!element) {
    return false;
  }

  return schema.checkAttribute(element.name, 'alightPredefinedLinkPluginHref');
}

/**
 * Adds the protocol prefix to the specified `link` when needed.
 */
export function addLinkProtocolIfApplicable(link: string, defaultProtocol?: string): string {
  // Don't modify predefined links
  if (isPredefinedLink(link)) {
    return link;
  }

  const isProtocolNeeded = !!defaultProtocol && !linkHasProtocol(link);
  return link && isProtocolNeeded ? defaultProtocol + link : link;
}

/**
 * Checks if protocol is already included in the link.
 */
export function linkHasProtocol(link: string): boolean {
  return PROTOCOL_REG_EXP.test(link);
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
   * Scrolls the view to the desired bookmark.
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
 * Extracts the predefined link ID from the URL or attributes
 */
export function extractPredefinedLinkId(href: string | null | undefined): string | null {
  if (!href) return null;

  // For numeric IDs, return directly
  if (/^[0-9]+$/.test(href)) {
    return href;
  }

  // For predefined format with explicit prefixes
  const prefixMatch = href.match(/^(id:|name:|link:|predefined:)(.+)$/i);
  if (prefixMatch && prefixMatch[2]) {
    return prefixMatch[2];
  }

  // For format prefixes
  if (href.startsWith('ahcustom:')) {
    return href.substring(9);
  }

  // For hash-prefixed IDs
  if (href.startsWith('#')) {
    return href.substring(1);
  }

  // Try to extract from HTML structure
  const ahLinkMatch = href.match(/name="([^"]+)"/);
  if (ahLinkMatch && ahLinkMatch[1]) {
    return ahLinkMatch[1];
  }

  // Check for data-link-name attribute
  const dataLinkNameMatch = href.match(/data-link-name="([^"]+)"/);
  if (dataLinkNameMatch && dataLinkNameMatch[1]) {
    return dataLinkNameMatch[1];
  }

  // If it passes our isPredefinedLink check but we couldn't extract an id,
  // just return the href itself as the ID
  if (isPredefinedLink(href)) {
    return href;
  }

  return null;
}

/**
 * Returns true if element has AHCustomeLink class
 */
export function hasAHCustomeLinkClass(element: ViewAttributeElement): boolean {
  return element.hasClass('AHCustomeLink');
}

/**
 * Filters link attributes to remove unwanted attributes
 */
export function filterLinkAttributes(attributes: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};

  // Keep only the attributes we want
  for (const key in attributes) {
    // Skip data-cke-saved-href attribute
    if (key === 'data-cke-saved-href') {
      continue;
    }

    // Always keep href as '#' for predefined links
    if (key === 'href' && (attributes[key] === '' || attributes[key] === '#')) {
      result[key] = '#';
      continue;
    }

    // Keep all other attributes
    result[key] = attributes[key];
  }

  return result;
}

/**
 * Ensures links have the ah:link structure in the HTML.
 */
export function ensurePredefinedLinkStructure(html: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links with AHCustomeLink class
    const links = tempDiv.querySelectorAll('a.AHCustomeLink');

    links.forEach(link => {
      // Get link name from data-link-name attribute
      const linkName = link.getAttribute('data-link-name') || '';

      // Skip if no valid link name
      if (!linkName) {
        return;
      }

      // Check if there's already an ah:link element
      const existingAhLink = link.querySelector('ah\\:link, ah:link');

      // If there's already an ah:link with correct name, keep it
      if (existingAhLink && existingAhLink.getAttribute('name') === linkName) {
        return;
      }

      // Otherwise, create a proper structure
      const linkText = link.textContent || '';
      link.innerHTML = `<ah:link name="${linkName}">${linkText}</ah:link>`;
    });

    return tempDiv.innerHTML;
  } catch (error) {
    console.error('Error ensuring predefined link structure:', error);
    return html;
  }
}

/**
 * Type-safe helper function to check if a model element has a specific name
 * 
 * @param element The element to check
 * @param name The element name to check for
 * @returns True if the element has the specified name
 */
export function isModelElementWithName(node: ModelNode, name: string): node is Element {
  return node.is('element') && node.name === name;
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
