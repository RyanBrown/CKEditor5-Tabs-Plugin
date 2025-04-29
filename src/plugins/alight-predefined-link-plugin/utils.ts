// src/plugins/alight-predefined-link-plugin/utils.ts
import type {
  DowncastConversionApi,
  Element,
  Schema,
  ViewAttributeElement,
  ViewNode,
  ViewDocumentFragment,
  ViewElement as ViewElementType
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

// Simplified email test - should be run over previously found URL.
const EMAIL_REG_EXP = /^[\S]+@((?![-_])(?:[-\w\u00a1-\uffff]{0,63}[^-_]\.))+(?:[a-z\u00a1-\uffff]{2,})$/i;

// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the link ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'https?',
  'ftps?',
  'mailto'
];

/**
 * A keystroke used by the {@link module:link/linkui~AlightPredefinedLinkPluginUI link UI feature}.
 */
export const LINK_KEYSTROKE = 'Ctrl+K';

/**
 * Returns `true` if a given view node is the link element.
 */
export function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  return (
    node.is('attributeElement') && (
      !!node.getCustomProperty('alight-predefined-link') ||
      node.hasClass('AHCustomeLink') ||
      node.getAttribute('data-id') === 'predefined_link'
    )
  );
}

/**
 * Helper function to detect predefined links based on attributes
 * rather than URL suffix
 */
// Update the isPredefinedLink function in utils.ts
export function isPredefinedLink(url: string | null | undefined): boolean {
  // If the URL is empty, null, or undefined, it's not a predefined link
  if (!url) return false;

  return true;
}

/**
 * Creates a link {@link module:engine/view/attributeelement~AttributeElement} with the provided `href` attribute.
 */
export function createLinkElement(href: string, { writer }: DowncastConversionApi): ViewAttributeElement {
  // Check if this is a predefined link
  const isPredefined = isPredefinedLink(href);

  // Extract link name if it's a predefined link
  const linkName = extractPredefinedLinkId(href) || href;

  // Create link element as attribute element - this is important for proper rendering
  const linkElement = writer.createAttributeElement('a', {
    'href': '#',
    'class': 'AHCustomeLink',
    'data-id': 'predefined_link'
  }, {
    priority: 5
  });

  // Create the inner ah:link element with higher priority
  const ahLinkElement = writer.createAttributeElement('ah:link', {
    'name': linkName
  }, {
    priority: 6
  });

  // Set custom property for identification
  writer.setCustomProperty('alight-predefined-link', true, linkElement);

  // Return the link element - we'll use the wrap method to nest elements properly
  return linkElement;
}

/**
 * Returns a safe URL based on a given value.
 *
 * A URL is considered safe if it is safe for the user (does not contain any malicious code).
 *
 * If a URL is considered unsafe, a simple `"#"` is returned.
 *
 * @internal
 */
export function ensureSafeUrl(url: unknown, allowedProtocols: Array<string> = DEFAULT_LINK_PROTOCOLS): string {
  const urlString = String(url);

  // Special handling for predefined links
  if (isPredefinedLink(urlString)) {
    return urlString; // Return unmodified
  }

  // For javascript: and other protocols, check if they're in allowed protocols
  for (const protocol of allowedProtocols) {
    if (urlString.toLowerCase().startsWith(`${protocol}:`)) {
      return urlString; // Allow if it's in the allowed protocols list
    }
  }

  // Normal URL safety handling for non-predefined links
  const protocolsList = allowedProtocols.join('|');
  const customSafeRegex = new RegExp(`${SAFE_URL_TEMPLATE.replace('<protocols>', protocolsList)}`, 'i');

  return isSafeUrl(urlString, customSafeRegex) ? urlString : '#';
}

/**
 * Checks whether the given URL is safe for the user (does not contain any malicious code).
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
 * Returns `true` if the specified `element` can be linked (the element allows the `alightPredefinedLinkPluginHref` attribute).
 */
export function isLinkableElement(element: Element | null, schema: Schema): element is Element {
  if (!element) {
    return false;
  }

  return schema.checkAttribute(element.name, 'alightPredefinedLinkPluginHref');
}

/**
 * Returns `true` if the specified `value` is an external email.
 */
export function isEmail(value: string): boolean {
  return EMAIL_REG_EXP.test(value);
}

/**
 * Adds the protocol prefix to the specified `link` when:
 *
 * * it does not contain it already, and there is a {@link module:link/linkconfig~LinkConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided,
 * * or the link is an email address.
 */
export function addLinkProtocolIfApplicable(link: string, defaultProtocol?: string): string {
  // Don't modify predefined links
  if (isPredefinedLink(link)) {
    return link;
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
 * Extracts the predefined link ID from the URL or attributes
 * @param href The href attribute value
 * @returns The link ID or null if not a predefined link
 */
export function extractPredefinedLinkId(href: string | null | undefined): string | null {
  if (!href) return null;

  // Handle links with ah:link nested element - extract from the name attribute
  const ahLinkMatch = href.match(/name="([^"]+)"/);
  if (ahLinkMatch && ahLinkMatch[1]) {
    return ahLinkMatch[1];
  }

  // Handle numeric IDs
  if (/^[0-9]+$/.test(href)) {
    return href;
  }

  // Extract LinkId from the href (used in onclick format links)
  const linkIdMatch = href.match(/LinkId:([A-Z_0-9]+)/i);
  if (linkIdMatch && linkIdMatch[1]) {
    return linkIdMatch[1];
  }

  // If nothing specific is found, just return the href as-is
  // for predefined links
  return isPredefinedLink(href) ? href : null;
}

// Add a function to check if an element has AHCustomeLink class
export function hasAHCustomeLinkClass(element: ViewAttributeElement): boolean {
  return element.hasClass('AHCustomeLink');
}

/**
 * Filters link attributes to remove unwanted attributes like data-cke-saved-href
 * @param attributes Original attributes object
 * @returns Filtered attributes object
 */
export function filterLinkAttributes(attributes: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};

  // Copy only the attributes we want to keep
  for (const key in attributes) {
    // Skip data-cke-saved-href attribute
    if (key === 'data-cke-saved-href') {
      continue;
    }

    // Skip empty href or "#" href for non-predefined links
    if (key === 'href' && (attributes[key] === '' || attributes[key] === '#')) {
      // Keep empty href only for predefined links
      if (attributes['data-id'] === 'predefined_link') {
        result[key] = '#';
      } else {
        result[key] = '#';
      }
      continue;
    }

    // Keep all other attributes
    result[key] = attributes[key];
  }

  return result;
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
