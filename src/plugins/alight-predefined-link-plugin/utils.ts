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
 */
export function isPredefinedLink(url: string | null | undefined): boolean {
  // If the URL is empty, null, or undefined, it's not a predefined link
  return !!url;
}

/**
 * Creates a link AttributeElement with the provided `href` attribute.
 * Updated to ensure consistent structure with ah:link element.
 */
export function createLinkElement(href: string, { writer }: DowncastConversionApi): ViewAttributeElement {
  // Create the link element as an attribute element with required attributes
  const linkElement = writer.createAttributeElement('a', {
    'href': '#', // Always use # for predefined links
    'class': 'AHCustomeLink',
    'data-id': 'predefined_link'
  }, {
    priority: 5,
    id: 'predefined-link'
  });

  // Set custom property for link identification
  writer.setCustomProperty('alight-predefined-link', true, linkElement);

  // Note: The actual ah:link element will be added during the data downcast conversion
  // This function is primarily used for the editing view where we simplify the structure

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
 * Updated to ensure the exact structure needed.
 */
export function ensurePredefinedLinkStructure(html: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all links with AHCustomeLink class
    const links = tempDiv.querySelectorAll('a.AHCustomeLink');

    links.forEach(link => {
      // Always ensure these attributes are set correctly
      link.setAttribute('href', '#');
      link.setAttribute('data-id', 'predefined_link');

      // Look for existing ah:link element
      let existingAhLink = link.querySelector('ah\\:link') || link.querySelector('ah:link');
      let linkName = '';

      // Try to get the link name from various sources
      if (existingAhLink) {
        linkName = existingAhLink.getAttribute('name') || '';
      }

      if (!linkName) {
        // Try alternative attribute sources
        linkName = link.getAttribute('data-link-name') ||
          link.getAttribute('data-href') ||
          link.getAttribute('alightPredefinedLinkPluginLinkName') || '';
      }

      // If still no name, use the text content or a fallback
      if (!linkName || linkName.trim() === '') {
        linkName = link.textContent?.trim() || 'unnamed-link';
      }

      // Save the original text content before modifying
      const textContent = link.textContent || '';

      // Create the standardized structure - explicit whitespace to match target format
      link.innerHTML = `<ah:link name="${linkName}">${textContent}</ah:link>`;

      // Verify the ah:link was created properly
      if (!link.querySelector('ah\\:link') && !link.querySelector('ah:link')) {
        // Try alternative approach if browser sanitized the custom element
        const wrapper = document.createElement('span');
        wrapper.setAttribute('class', 'ah-link-wrapper');
        wrapper.setAttribute('data-name', linkName);
        wrapper.textContent = textContent;
        link.innerHTML = '';
        link.appendChild(wrapper);
      }
    });

    return tempDiv.innerHTML;
  } catch (error) {
    console.error('Error ensuring predefined link structure:', error);
    return html;
  }
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
