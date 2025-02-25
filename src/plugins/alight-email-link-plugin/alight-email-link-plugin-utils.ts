// src/plugins/alight-email-link-plugin/alight-email-link-plugin-utils.ts
import { Writer, Element, Node } from '@ckeditor/ckeditor5-engine';
import { Editor } from '@ckeditor/ckeditor5-core';

// Interface representing the data associated with an email link.
export interface LinkData {
  email: string;
  orgName: string;
}

/**
 * Finds and returns the currently selected link element in the editor.
 * 
 * @param editor The CKEditor instance
 * @returns The selected link element or null if no link is selected
 */
export function getSelectedLinkElement(editor: Editor): Element | null {
  const view = editor.editing.view;
  const selection = view.document.selection;

  const selectedElement = selection.getSelectedElement() || selection.getFirstPosition()?.parent;

  if (!selectedElement) {
    return null;
  }

  // Check if the element itself is an anchor
  if (selectedElement.is('element', 'a')) {
    return selectedElement as unknown as Element;
  }

  // Otherwise, check parent elements recursively
  let parent = selectedElement.parent;
  while (parent) {
    if (parent.is('element', 'a')) {
      return parent as unknown as Element;
    }
    parent = parent.parent;
  }

  return null;
}

/**
 * Validates an email address with or without the mailto: prefix.
 * 
 * @param email Email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Remove mailto: prefix if present (case-insensitive)
  const cleanEmail = email.replace(/^mailto:/i, '').trim();

  // Email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(cleanEmail);
}

/**
 * Normalizes an email address by ensuring it has the mailto: prefix.
 * 
 * @param email Email address with or without mailto: prefix
 * @returns Normalized email address with mailto: prefix
 */
export function normalizeEmailAddress(email: string): string {
  // Remove any existing mailto: prefix (case-insensitive)
  const cleanEmail = email.replace(/^mailto:/i, '').trim();
  // Add back the lowercase mailto: prefix
  return `mailto:${cleanEmail}`;
}

// Handler class for organization name operations on email links.
export class OrganizationNameHandler {
  private readonly editor: Editor;

  /**
   * Creates a new OrganizationNameHandler.
   * 
   * @param editor The CKEditor instance
   */
  constructor(editor: Editor) {
    this.editor = editor;
  }

  /**
   * Creates combined link text with organization name.
   * 
   * @param writer The model writer
   * @param emailText The email text or selected text
   * @param orgName The organization name to append
   * @returns The combined text for the link
   */
  public createLinkText(writer: Writer, emailText: string, orgName: string): string {
    if (!orgName) return emailText;

    // Format the combined text with organization name in parentheses
    const result = `${emailText} (${orgName})`;
    console.log('OrganizationNameHandler.createLinkText:', { emailText, orgName, result });
    return result;
  }

  /**
   * Extracts organization name from link text if present.
   * Looks for text pattern "text (Organization Name)" and extracts the part in parentheses.
   * 
   * @param linkElement The link element
   * @returns The extracted organization name, or empty string if none found
   */
  public extractOrgNameFromLink(linkElement: Element): string {
    if (!linkElement || !linkElement.childCount) return '';

    // Get the text content of the link
    const textNode = linkElement.getChild(0) as Node;
    const linkText = textNode && 'data' in textNode ? textNode.data as string : '';

    // Look for text in the format "text (Organization Name)"
    const match = linkText.match(/ \(([^)]+)\)$/);
    return match ? match[1] : '';
  }

  /**
   * Extracts the base text from link (without organization name part).
   * 
   * @param linkElement The link element
   * @returns The extracted text without organization name
   */
  public extractBaseTextFromLink(linkElement: Element): string {
    if (!linkElement || !linkElement.childCount) return '';

    // Get the text content of the link
    let linkText = '';
    const textNode = linkElement.getChild(0);
    if (textNode && 'data' in textNode) {
      linkText = textNode.data as string;
    }

    // Remove the organization name part if it exists
    const result = linkText.replace(/ \([^)]+\)$/, '');

    console.log('OrganizationNameHandler.extractBaseTextFromLink:', { linkText, result, changed: linkText !== result });
    return result;
  }

  /**
   * Extracts complete link data including email and organization name.
   * 
   * @param linkElement The link element to extract data from
   * @returns Object containing email and orgName
   */
  public extractLinkData(linkElement: Element): LinkData {
    // Extract organization name
    const orgName = this.extractOrgNameFromLink(linkElement);

    // Get the link URL attribute
    const linkHref = linkElement.getAttribute('linkHref') as string || '';

    // Extract email from the href (removing mailto: prefix)
    const email = linkHref.replace(/^mailto:/i, '');

    return { email, orgName };
  }
}