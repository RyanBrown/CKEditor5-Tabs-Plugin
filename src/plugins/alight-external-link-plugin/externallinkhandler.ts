// src/plugins/alight-external-link-plugin/externallinkhandler.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
  Element,
  UpcastElementEvent,
  ViewElement,
  UpcastConversionApi,
  Range,
  View
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

    // Process existing links to add orgnameattr when needed
    this._processExistingLinks();

    // Also process links whenever the document is changed or when the editor becomes ready
    this.listenTo(editor.model.document, 'change', () => {
      this._processExistingLinks();
    });

    this.listenTo(editor, 'ready', () => {
      this._processExistingLinks();
    });
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
   * Scans the document for links with (org name) in the text but no orgnameattr
   * and adds the attribute automatically
   */
  private _processExistingLinks(): void {
    const editor = this.editor;
    const model = editor.model;
    const view = editor.editing.view;
    const viewDocument = view.document;

    // Scan the entire document for links with organization names in the text
    model.change(writer => {
      const root = model.document.getRoot();
      if (!root) return;

      const range = model.createRangeIn(root);

      for (const item of range.getItems()) {
        // Only process text nodes that have the alightExternalLinkPluginHref attribute
        if (item.is('$text') && item.hasAttribute('alightExternalLinkPluginHref')) {
          // Try to extract organization name from the text - handle both with and without attributes
          const itemData = item.data;
          const match = itemData.match(/^(.*?)\s+\(([^)]+)\)$/);

          if (match && match[2]) {
            const orgName = match[2];

            // If the node doesn't have the org name attribute or it's different, update it
            if (!item.hasAttribute('alightExternalLinkPluginOrgName') ||
              item.getAttribute('alightExternalLinkPluginOrgName') !== orgName) {

              // Get the range of the entire link
              const href = item.getAttribute('alightExternalLinkPluginHref');
              const linkRange = this._getLinkRange(item, model);

              if (linkRange) {
                // Apply the organization name attribute to the entire link
                writer.setAttribute('alightExternalLinkPluginOrgName', orgName, linkRange);
              }
            }
          }
        }
      }
    });

    // Process links in the view to directly set the attribute in the DOM
    editor.editing.view.change(viewWriter => {
      // Create a range in the entire view document
      const viewRoot = viewDocument.getRoot();
      if (!viewRoot) return;

      const viewRange = view.createRangeIn(viewRoot);

      // Find all links that don't have orgnameattr but have text with (org name) pattern
      for (const item of viewRange.getItems()) {
        if (item.is('element', 'a') && item.getAttribute('data-id') === 'external_editor') {
          // Extract the text content from the link - Handle non-breaking spaces
          let linkText = '';
          for (const child of item.getChildren()) {
            if (child.is('$text')) {
              // Replace any non-breaking spaces with regular spaces
              linkText += child.data.replace(/\u00A0/g, ' ');
            }
          }

          // Check for organization name pattern using a more flexible regex
          // This handles potential non-breaking spaces and other special characters
          const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);
          if (match && match[2]) {
            const orgName = match[2];

            // Set the orgnameattr attribute if it doesn't exist or is different
            if (!item.hasAttribute('orgnameattr') || item.getAttribute('orgnameattr') !== orgName) {
              viewWriter.setAttribute('orgnameattr', orgName, item);

              // Find the corresponding model element and set the attribute there as well
              try {
                const position = view.createPositionBefore(item);
                const modelPosition = editor.editing.mapper.toModelPosition(position);

                if (modelPosition) {
                  model.change(modelWriter => {
                    const node = modelPosition.nodeAfter || modelPosition.textNode;
                    if (node && node.hasAttribute('alightExternalLinkPluginHref')) {
                      const range = this._getLinkRange(node, model);
                      if (range) {
                        modelWriter.setAttribute('alightExternalLinkPluginOrgName', orgName, range);
                      }
                    }
                  });
                }
              } catch (error) {
                // Ignore errors in the mapping process
                console.warn('Error mapping view to model:', error);
              }
            }
          }
        }
      }
    });

    // Extra processing to ensure the DOM elements have the attributes
    // This is a more direct approach to fix existing links in the DOM
    setTimeout(() => {
      // Direct DOM manipulation to ensure orgnameattr is set for existing links
      const editorElement = editor.editing.view.getDomRoot();
      if (editorElement) {
        const links = editorElement.querySelectorAll('a[data-id="external_editor"]:not([orgnameattr])');
        links.forEach(link => {
          // Get text content and normalize to handle possible non-breaking spaces
          const linkText = link.textContent?.replace(/\u00A0/g, ' ') || '';
          const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);
          if (match && match[2]) {
            const orgName = match[2];

            // Direct DOM update
            link.setAttribute('orgnameattr', orgName);

            // Also update the model (via a view change)
            editor.editing.view.change(writer => {
              // Get the view root
              const viewRoot = editor.editing.view.document.getRoot();
              if (!viewRoot) return;

              // Create a new range to search in
              const newViewRange = editor.editing.view.createRangeIn(viewRoot);

              // Find the matching link by comparing DOM elements
              for (const viewItem of newViewRange.getItems()) {
                if (viewItem.is('element', 'a') &&
                  viewItem.getAttribute('data-id') === 'external_editor' &&
                  !viewItem.hasAttribute('orgnameattr')) {

                  // Check if this is the same DOM element
                  const domLink = editor.editing.view.domConverter.mapViewToDom(viewItem);
                  if (domLink === link) {
                    writer.setAttribute('orgnameattr', orgName, viewItem);
                    break;
                  }
                }
              }
            });
          }
        });
      }
    }, 100);
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
  private _getLinkText(linkRange: Range): string {
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
    const href = textNode.getAttribute('linkHref') || textNode.getAttribute('alightExternalLinkPluginHref');

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
      (pos.parent.previousSibling.getAttribute('linkHref') === href ||
        pos.parent.previousSibling.getAttribute('alightExternalLinkPluginHref') === href)) {
      pos = model.createPositionBefore(pos.parent.previousSibling);
    }

    // Extend to next nodes with the same link
    pos = endPos;
    while (pos.parent.nextSibling &&
      pos.parent.nextSibling.is('$text') &&
      (pos.parent.nextSibling.getAttribute('linkHref') === href ||
        pos.parent.nextSibling.getAttribute('alightExternalLinkPluginHref') === href)) {
      endPos = model.createPositionAfter(pos.parent.nextSibling);
      pos = endPos;
    }

    return model.createRange(startPos, endPos);
  }
}
