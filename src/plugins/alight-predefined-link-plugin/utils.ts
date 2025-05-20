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
    // Check if it's an 'a' element
    if (node.is('element', 'a')) {
      // This is an 'a' element, now check if it's one of our predefined links
      return !!(
        // Either it has the custom property
        (node.getCustomProperty && node.getCustomProperty('alight-predefined-link')) ||
        // Or it has the AHCustomeLink class
        (typeof node.hasClass === 'function' && node.hasClass('AHCustomeLink')) ||
        // Or it has the data-id attribute
        (node.getAttribute && node.getAttribute('data-id') === 'predefined_link') ||
        // Or it contains an ah:link element
        (node.getChild &&
          Array.from(node.getChildren()).some(child =>
            child.is && child.is('element', 'ah:link')
          ))
      );
    }

    // Check if it's an attribute element for 'a'
    if (node.is('attributeElement') && node.name === 'a') {
      return !!(
        (node.getCustomProperty && node.getCustomProperty('alight-predefined-link')) ||
        (typeof node.hasClass === 'function' && node.hasClass('AHCustomeLink')) ||
        (node.getAttribute && node.getAttribute('data-id') === 'predefined_link')
      );
    }
    return false;
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
 * Prevents nesting of anchor tags and ensures proper structure.
 */
export function ensurePredefinedLinkStructure(html: string): string {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // First pass: Find nested links - This is the common cause of the issue
    const nestedLinks = Array.from(tempDiv.querySelectorAll('a a'));

    // Handle nested links first
    nestedLinks.forEach(innerLink => {
      const outerLink = innerLink.closest('a');
      if (!outerLink || outerLink === innerLink) return;

      // Get the inner link content and attributes
      const innerLinkName = innerLink.getAttribute('data-link-name') ||
        extractPredefinedLinkId(innerLink.getAttribute('href') || '') ||
        '';
      const innerContent = innerLink.textContent || '';

      // Remove the inner link but keep the text content
      const textNode = document.createTextNode(innerContent);
      innerLink.parentNode?.replaceChild(textNode, innerLink);
    });

    // Second pass: Now process all AHCustomeLink links
    const links = tempDiv.querySelectorAll('a.AHCustomeLink');

    links.forEach(link => {
      // Get the link name from various possible sources
      let linkName = '';

      // Check for ah:link elements
      const ahLink = link.querySelector('ah\\:link') || link.querySelector('ah:link');

      if (ahLink) {
        linkName = ahLink.getAttribute('name') || '';
      }

      // If no linkName from ah:link, try data-link-name or href attributes
      if (!linkName) {
        linkName = link.getAttribute('data-link-name') ||
          link.getAttribute('href') || '';

        // If href is just '#' or empty, generate a random name
        if (!linkName || linkName === '#') {
          linkName = 'link-' + Math.random().toString(36).substring(2, 7);
        }
      }

      // Extract the text content
      let textContent = link.textContent || '';

      // Create a clean new link with proper structure
      const newLink = document.createElement('a');
      newLink.className = 'AHCustomeLink';
      newLink.setAttribute('href', '#');
      newLink.setAttribute('data-id', 'predefined_link');

      // Create proper ah:link structure
      const ahLinkElement = document.createElement('ah:link');
      ahLinkElement.setAttribute('name', linkName);
      ahLinkElement.textContent = textContent;

      // Add ah:link to the new link
      newLink.appendChild(ahLinkElement);

      // Replace the original link with our clean one
      if (link.parentNode) {
        link.parentNode.replaceChild(newLink, link);
      }
    });

    // Third pass: Handle orphaned ah:link elements outside of a tags (if any)
    const orphanedAhLinks = Array.from(tempDiv.querySelectorAll('ah\\:link, ah:link')).filter(ahLink => {
      // Check if direct parent is not an 'a' element
      return !ahLink.parentElement || ahLink.parentElement.tagName.toLowerCase() !== 'a';
    });

    orphanedAhLinks.forEach(ahLink => {
      // Get the name attribute if it exists
      const linkName = ahLink.getAttribute('name') || ('link-' + Math.random().toString(36).substring(2, 7));
      const textContent = ahLink.textContent || '';

      // Create a proper link structure
      const newLink = document.createElement('a');
      newLink.className = 'AHCustomeLink';
      newLink.setAttribute('href', '#');
      newLink.setAttribute('data-id', 'predefined_link');

      // Create a new ah:link with proper attributes
      const newAhLink = document.createElement('ah:link');
      newAhLink.setAttribute('name', linkName);
      newAhLink.textContent = textContent;

      // Add to the link
      newLink.appendChild(newAhLink);

      // Replace the orphaned ah:link with our proper structure
      if (ahLink.parentNode) {
        ahLink.parentNode.replaceChild(newLink, ahLink);
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
