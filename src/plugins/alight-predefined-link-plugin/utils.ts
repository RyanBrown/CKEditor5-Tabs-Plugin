// src/plugins/alight-predefined-link-plugin/utils.ts
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
const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'https?',
  'ftps?',
];

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
      (typeof node.hasClass === 'function' && node.hasClass('AHCustomeLink'))
    );
  } catch (e) {
    console.error('Error in isLinkElement check:', e);
    return false;
  }
}

/**
 * Helper function to check if an element has the predefined link data-id
 */
export function hasPredefinedLinkId(element: any): boolean {
  if (!element) return false;

  // Check if it's a ViewAttributeElement with a getAttribute method
  return element.getAttribute && typeof element.getAttribute === 'function' &&
    element.getAttribute('data-id') === 'predefined_link';
}

/**
 * Helper function to detect predefined links
 * 
 * IMPORTANT: A valid predefined link MUST have either:
 * 1. A URL without standard protocols (http://, https://, mailto:)
 * 2. The AHCustomeLink class OR data-id="predefined_link" attribute
 * 
 * @param url The URL to check
 * @param element Optional element to check for AHCustomeLink class or data-id
 * @returns true if URL format is valid or if element has one of the required identifiers
 */
export function isPredefinedLink(url: string | null | undefined, element?: any): boolean {
  // If the URL is empty, null, or undefined, check if the element has identifiers
  if (!url && element) {
    return hasAHCustomeLink(element) || hasPredefinedLinkId(element);
  }

  // If no URL and no element, it's not a predefined link
  if (!url) return false;

  // Check URL format
  const validUrlFormat = !url.includes('://') && !url.startsWith('mailto:');

  // If URL format is valid, it's a predefined link
  if (validUrlFormat) return true;

  // If element is provided, check for either identifier even if URL format isn't valid
  if (element !== undefined) {
    return hasAHCustomeLink(element) || hasPredefinedLinkId(element);
  }

  // Not a predefined link
  return false;
}

/**
 * Helper function to check if an element has AHCustomeLink class
 * This should be used in conjunction with isPredefinedLink
 */
export function hasAHCustomeLink(element: any): boolean {
  if (!element) return false;

  // Check if it's a ViewAttributeElement with a hasClass method
  return element.hasClass && typeof element.hasClass === 'function' && element.hasClass('AHCustomeLink');
}

/**
 * Creates a link AttributeElement with the provided `href` attribute.
 */
export function createLinkElement(href: string, { writer }: DowncastConversionApi): ViewAttributeElement {
  // Create the link element as an attribute element with required attributes
  const linkElement = writer.createAttributeElement('a', {
    'href': href,
    'class': 'AHCustomeLink',
    'data-id': 'predefined_link'
  }, {
    priority: 5,
    id: 'predefined-link'
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

  // Try to extract from HTML structure
  const ahLinkMatch = href.match(/name="([^"]+)"/);
  if (ahLinkMatch && ahLinkMatch[1]) {
    return ahLinkMatch[1];
  }

  // For predefined links, return the href itself
  return isPredefinedLink(href) ? href : null;
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
 * Simplified to directly create the correct structure without complex parsing.
 */
export function ensurePredefinedLinkStructure(html: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links that could be predefined links (either by class or data-id)
    const linksWithClass = Array.from(tempDiv.querySelectorAll('a.AHCustomeLink'));
    const linksWithDataId = Array.from(tempDiv.querySelectorAll('a[data-id="predefined_link"]'));

    // Create a Set to avoid processing the same link twice
    const processedLinks = new Set<HTMLElement>();

    // Process links with AHCustomeLink class
    linksWithClass.forEach(link => {
      const htmlLink = link as HTMLElement;
      processedLinks.add(htmlLink);
      processPredefinedLink(htmlLink);
    });

    // Process links with data-id attribute (if not already processed)
    linksWithDataId.forEach(link => {
      const htmlLink = link as HTMLElement;
      if (!processedLinks.has(htmlLink)) {
        processPredefinedLink(htmlLink);
      }
    });

    return tempDiv.innerHTML;
  } catch (error) {
    console.error('Error ensuring predefined link structure:', error);
    return html;
  }
}

/**
 * Helper function to process a predefined link
 * @param link The HTML anchor element to process
 */
function processPredefinedLink(link: HTMLElement): void {
  // Look for existing ah:link element
  const existingAhLink = link.querySelector('ah\\:link') || link.querySelector('ah:link');
  let linkName = '';

  if (existingAhLink) {
    // Get name from existing ah:link
    linkName = existingAhLink.getAttribute('name') || '';

    // Just keep the existing structure if it's already correct
    if (linkName) {
      return;
    }
  }

  // If we don't have a valid name, try to get it from data attributes
  if (!linkName) {
    linkName = link.getAttribute('data-link-name') || '';
  }

  // If we still don't have a valid name, keep original structure
  if (!linkName) {
    return;
  }

  // Create a proper structure with ah:link
  link.innerHTML = `<ah:link name="${linkName}">${link.textContent}</ah:link>`;
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
