// src/plugins/alight-external-link-plugin/ExternalLinkHandler.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
  Element,
  UpcastElementEvent,
  ViewElement,
  UpcastConversionApi
} from '@ckeditor/ckeditor5-engine';
import AlightExternalLinkPluginEditing from './linkediting';
import { isValidUrl, ensureUrlProtocol } from './utils';

/**
 * External Link Handler plugin to ensure all external links are processed
 * through the Alight External Link UI.
 */
export default class ExternalLinkHandler extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkPluginEditing] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'ExternalLinkHandler' as const;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;

    // Override the standard link command
    this._interceptLinkCommands();

    // Handle pasted links
    this._enableLinkDetection();

    // Monitor for conflicting link attributes and resolve them
    this._handleConflictingLinks();
  }

  /**
   * Intercepts the standard link commands to redirect http/https links
   * to the AlightExternalLinkPlugin.
   */
  private _interceptLinkCommands(): void {
    const editor = this.editor;

    // Get the original commands
    const originalLinkCommand = editor.commands.get('link');
    const alightExternalLinkCommand = editor.commands.get('alight-external-link');

    if (!originalLinkCommand || !alightExternalLinkCommand) {
      return;
    }

    // Monkey patch the execute method of the link command
    const originalExecute = originalLinkCommand.execute;
    originalLinkCommand.execute = function (href: string, options = {}) {
      // If the link is a web URL, use our custom external link command
      if (href && typeof href === 'string' &&
        (href.startsWith('http://') || href.startsWith('https://') || isValidUrl(href))) {

        // Ensure URL has protocol
        const secureHref = ensureUrlProtocol(href);

        // Execute our custom command instead
        editor.execute('alight-external-link', secureHref, options);
      } else {
        // For non-web links, we'll now block the action since we only support http/https
        console.warn('AlightExternalLinkPlugin only supports HTTP and HTTPS URLs.');
        // Don't execute the original command for non-http/https URLs
      }
    };
  }

  /**
   * Detects when links are pasted or typed and ensures they're 
   * handled by the AlightExternalLinkPlugin
   */
  private _enableLinkDetection(): void {
    const editor = this.editor;

    // Get the clipboard pipeline plugin
    const clipboardPipeline = editor.plugins.get('ClipboardPipeline');

    // Listen for content insertion
    clipboardPipeline.on('inputTransformation', (evt, data) => {
      // Skip if not pasted content
      if (data.method !== 'paste') {
        return;
      }

      // Get the plain text
      const text = data.dataTransfer.getData('text/plain');

      // If it's a valid HTTP/HTTPS URL, handle it
      if (text && this._isExternalUrl(text)) {
        // Ensure the URL has a protocol
        const externalLink = ensureUrlProtocol(text);

        // Replace the pasted text with a link
        setTimeout(() => {
          editor.execute('alight-external-link', externalLink);
        }, 0);

        // Stop the default paste behavior
        evt.stop();
      }

      // Check for links in HTML content
      const html = data.dataTransfer.getData('text/html');
      if (html && (html.includes('http://') || html.includes('https://'))) {
        // Let the paste happen, but then find and convert any links
        setTimeout(() => {
          this._convertLinks();
        }, 0);
      }
    }, { priority: 'high' });
  }

  /**
   * Monitors for conflicting link attributes and resolves them
   */
  private _handleConflictingLinks(): void {
    const editor = this.editor;
    const model = editor.model;

    // Monitor document changes to detect conflicting links
    model.document.on('change', () => {
      // Don't check during selection changes only
      const changes = model.document.differ.getChanges();
      if (changes.length === 0) {
        return;
      }

      model.change(writer => {
        const root = model.document.getRoot();
        if (!root) return;

        const range = model.createRangeIn(root);

        for (const item of range.getItems()) {
          // Check for conflicting attributes (both linkHref and alightExternalLinkPluginHref)
          if (item.is('$text') &&
            item.hasAttribute('linkHref') &&
            item.hasAttribute('alightExternalLinkPluginHref')) {

            const linkHref = item.getAttribute('linkHref');

            // If it's an external link, keep only our attribute
            if (linkHref && typeof linkHref === 'string' &&
              (linkHref.startsWith('http://') || linkHref.startsWith('https://'))) {
              writer.removeAttribute('linkHref', item);
            } else {
              // Otherwise, keep the standard link attribute
              writer.removeAttribute('alightExternalLinkPluginHref', item);
            }
          }

          // Handle non-http/https links in linkHref attribute - convert or remove them
          if (item.is('$text') && item.hasAttribute('linkHref')) {
            const linkHref = item.getAttribute('linkHref');

            if (linkHref && typeof linkHref === 'string') {
              // For non-HTTP/HTTPS links like mailto:, tel:, etc., remove them
              // as this plugin only supports HTTP/HTTPS
              if (!linkHref.startsWith('http://') && !linkHref.startsWith('https://') &&
                !this._isExternalUrl(linkHref)) {
                writer.removeAttribute('linkHref', item);
              }
            }
          }
        }
      });
    });
  }

  /**
   * Checks if a string is a valid external URL (HTTP/HTTPS only)
   */
  private _isExternalUrl(text: string): boolean {
    // Check for http/https URLs
    if (text.startsWith('http://') || text.startsWith('https://')) {
      return true;
    }

    // Check for valid URLs without protocol that can be converted to HTTP/HTTPS
    return isValidUrl(text);
  }

  /**
   * Finds and converts standard links in the editor content
   * to use the AlightExternalLinkPlugin
   */
  /**
 * Finds and converts standard links in the editor content
 * to use the AlightExternalLinkPlugin
 */
  private _convertLinks(): void {
    const editor = this.editor;
    const model = editor.model;

    // Find all external links in the model
    model.change(writer => {
      const root = model.document.getRoot();
      if (!root) return;

      const range = model.createRangeIn(root);

      for (const item of range.getItems()) {
        if (item.is('$text') && item.hasAttribute('linkHref')) {
          const href = item.getAttribute('linkHref');

          // Only process HTTP/HTTPS links
          if (typeof href === 'string' &&
            (href.startsWith('http://') || href.startsWith('https://'))) {
            // Get the link range
            const linkRange = this._getLinkRange(item, model);

            if (linkRange) {
              // Check for organization name in the link text
              const linkText = this._getLinkText(linkRange);
              let orgName = null;

              // Try to extract org name from text format "text (org name)"
              const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);
              if (match && match[2]) {
                orgName = match[2];
              }

              // Remove the standard link attribute
              writer.removeAttribute('linkHref', linkRange);

              // Apply our custom link attribute
              writer.setAttribute('alightExternalLinkPluginHref', href, linkRange);

              // Add organization name attribute if found
              if (orgName) {
                writer.setAttribute('alightExternalLinkPluginOrgName', orgName, linkRange);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Gets the text content of a link range
   */
  private _getLinkText(linkRange: any): string {
    let text = '';
    for (const item of linkRange.getItems()) {
      if (item.is('$text') || item.is('$textProxy')) {
        text += item.data;
      }
    }
    return text;
  }
  /**
   * Gets the range for a link
   */
  private _getLinkRange(textNode: any, model: any): any {
    const href = textNode.getAttribute('linkHref');

    if (!href) {
      return null;
    }

    // Find the position of the text node
    let pos = model.createPositionBefore(textNode);

    // Create a range that includes all text nodes with the same linkHref attribute
    const startPos = pos;
    let endPos = model.createPositionAfter(textNode);

    // Extend to previous nodes with the same link
    while (pos.parent.previousSibling &&
      pos.parent.previousSibling.is('$text') &&
      pos.parent.previousSibling.getAttribute('linkHref') === href) {
      pos = model.createPositionBefore(pos.parent.previousSibling);
    }

    // Extend to next nodes with the same link
    pos = endPos;
    while (pos.parent.nextSibling &&
      pos.parent.nextSibling.is('$text') &&
      pos.parent.nextSibling.getAttribute('linkHref') === href) {
      endPos = model.createPositionAfter(pos.parent.nextSibling);
      pos = endPos;
    }

    return model.createRange(startPos, endPos);
  }
}
