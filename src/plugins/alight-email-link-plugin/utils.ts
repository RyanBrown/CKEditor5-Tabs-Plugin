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

/**
 * Extended interface for DowncastConversionApi with our custom properties
 */
export interface ExtendedConversionApi extends DowncastConversionApi {
  attrs?: Record<string, string>;
  item?: any; // Using any for now, would be better to use a more specific type
}

const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex

const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';

// Enhanced email detection regex
const ENHANCED_EMAIL_REG_EXP = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the link ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'https?',
  'ftps?',
  'mailto'
];

/**
 * Returns `true` if a given view node is the link element.
 */
export function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  return node.is('attributeElement') && !!node.getCustomProperty('alight-email-link');
}

/**
 * Extracts organization name from the orgnameattr attribute
 */
export function extractOrganizationFromAttribute(linkElement: ViewAttributeElement | null): string | null {
  if (linkElement && linkElement.hasAttribute('orgnameattr')) {
    return linkElement.getAttribute('orgnameattr') as string;
  }
  return null;
}

/**
 * Creates a link {@link module:engine/view/attributeelement~AttributeElement} with the provided `href` attribute.
 * Adds the organization name attribute if it exists in the model or can be extracted from text content.
 */
export function createLinkElement(href: string, conversionApi: ExtendedConversionApi): ViewAttributeElement {
  // Start with default attributes
  const attributes: Record<string, string> = {
    href,
    'data-id': 'email_editor',
    ...(conversionApi.attrs || {})
  };

  // If no orgnameattr was provided but the item has the attribute
  if (!attributes.orgnameattr && conversionApi.item) {
    // First, check if the item has the organization attribute
    if (conversionApi.item.hasAttribute && conversionApi.item.hasAttribute('orgnameattr')) {
      attributes.orgnameattr = conversionApi.item.getAttribute('orgnameattr');
    }
    // If not, try to extract from text content
    else if (conversionApi.item.is && conversionApi.item.is('$text') && conversionApi.item.data) {
      // Replace any non-breaking spaces with regular spaces for consistency
      const itemData = conversionApi.item.data.replace(/\u00A0/g, ' ');
      const match = itemData.match(/^(.*?)\\s+\\(([^)]+)\\)$/);
      if (match && match[2]) {
        attributes.orgnameattr = match[2];
      }
    }
  }

  // Create the link element with attributes
  const linkElement = conversionApi.writer.createAttributeElement('a', attributes, { priority: 5 });
  conversionApi.writer.setCustomProperty('alight-email-link', true, linkElement);

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
 * Enhanced version with better pattern matching.
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
 * * it does not contain it already, and there is a {@link module:link/linkconfig~LinkConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided,
 * * or the link is an email address.
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
 * Removes the organization name from text, specifically looking for text
 * with the pattern "text (organization name)"
 * 
 * @param text The original text that might contain an organization name
 * @returns Text with organization name removed
 */
export function removeOrganizationName(text: string): string {
  return text.replace(/\s+\([^)]+\)$/, '');
}

/**
 * Adds organization name to text in the format "text (organization name)"
 * 
 * @param text The base text
 * @param organization The organization name to add
 * @returns Text with organization name appended
 */
export function addOrganizationName(text: string, organization: string): string {
  // First remove any existing organization
  const baseText = removeOrganizationName(text);
  return `${baseText} (${organization})`;
}

/**
 * Extracts and applies the organization name attribute to links that have the format
 * "text (org name)" but don't already have the orgnameattr attribute
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
  if (textNode.hasAttribute('orgnameattr')) {
    return textNode.getAttribute('orgnameattr');
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
      writer.setAttribute('orgnameattr', orgName, textNode);
    }

    return orgName;
  }

  return undefined;
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
