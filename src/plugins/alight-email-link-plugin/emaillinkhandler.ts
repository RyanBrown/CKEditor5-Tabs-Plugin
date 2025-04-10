// src/plugins/alight-email-link-plugin/emaillinkhandler.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Range, ViewElement } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginEditing from './linkediting';
import { isEmail } from './utils';

interface CustomLinkOptions {
  [key: string]: string | boolean;
}

/**
 * Email Link Handler plugin to ensure all mailto: links are processed
 * through the Alight Email Link UI.
 */
export default class EmailLinkHandler extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkPluginEditing] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'EmailLinkHandler' as const;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;

    // Override the standard link command
    this._interceptLinkCommands();

    // Prevent default link plugin from handling mailto links in upcast conversion
    this._preventDefaultEmailLinkUpcast();

    // Handle pasted mailto: links
    this._enableMailtoLinkDetection();

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
   * Intercepts the standard link commands to redirect mailto: links
   * to the AlightEmailLinkPlugin.
   */
  private _interceptLinkCommands(): void {
    const editor = this.editor;

    // Get the original commands
    const originalLinkCommand = editor.commands.get('link');
    const alightEmailLinkCommand = editor.commands.get('alight-email-link');

    if (!originalLinkCommand || !alightEmailLinkCommand) {
      return;
    }

    // Monkey patch the execute method of the link command
    const originalExecute = originalLinkCommand.execute;
    originalLinkCommand.execute = function (href: string,
      options: CustomLinkOptions = {}
    ) {
      // If the link is a mailto link, use our custom email link command
      if (href && typeof href === 'string' && (href.startsWith('mailto:') ||
        (href.includes('@') && !href.includes('://') && !href.startsWith('/')))) {

        // If it's an email address without the mailto: prefix, add it
        if (!href.startsWith('mailto:') && href.includes('@')) {
          href = 'mailto:' + href;
        }

        // Execute our custom command instead
        editor.execute('alight-email-link', href, options);
      } else {
        // For non-mailto links, use the original behavior
        originalExecute.call(this, href, options);
      }
    };
  }

  /**
  * Prevents the default link plugin from handling mailto: links in upcast conversion
  */
  private _preventDefaultEmailLinkUpcast(): void {
    const editor = this.editor;

    // Add a high-priority custom element-to-attribute converter for mailto links
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: /^mailto:|.*@.*$/
        }
      },
      model: {
        key: 'alightEmailLinkPluginHref',
        value: (viewElement: ViewElement) => {
          const href = viewElement.getAttribute('href');
          if (typeof href !== 'string') {
            return null;
          }

          // Ensure mailto: prefix
          return href.startsWith('mailto:') ? href : 'mailto:' + href;
        }
      },
      converterPriority: 'highest'
    });
  }

  /**
   * Detects when mailto: links are pasted or typed and ensures they're 
   * handled by the AlightEmailLinkPlugin
   */
  private _enableMailtoLinkDetection(): void {
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

      // If it's an email address, handle it
      if (text && this._isEmailAddress(text)) {
        // Add the mailto: prefix if missing
        const emailLink = text.startsWith('mailto:') ? text : 'mailto:' + text;

        // Replace the pasted text with a link
        setTimeout(() => {
          editor.execute('alight-email-link', emailLink);
        }, 0);

        // Stop the default paste behavior
        evt.stop();
      }

      // Check for mailto links in HTML content
      const html = data.dataTransfer.getData('text/html');
      if (html && html.includes('mailto:')) {
        // Let the paste happen, but then find and convert any mailto links
        setTimeout(() => {
          this._convertStandardMailtoLinks();
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
          // Check for conflicting attributes (both linkHref and alightEmailLinkPluginHref)
          if (item.is('$text') &&
            item.hasAttribute('linkHref') &&
            item.hasAttribute('alightEmailLinkPluginHref')) {

            const linkHref = item.getAttribute('linkHref');

            // If it's an email link, keep only our attribute
            if (linkHref && typeof linkHref === 'string' &&
              (linkHref.startsWith('mailto:') || isEmail(linkHref))) {
              writer.removeAttribute('linkHref', item);
            } else {
              // Otherwise, keep the standard link attribute
              writer.removeAttribute('alightEmailLinkPluginHref', item);
            }
          }
        }
      });
    });
  }

  /**
   * Checks if a string is a valid email address
   */
  private _isEmailAddress(text: string): boolean {
    // Remove mailto: prefix for validation
    const email = text.startsWith('mailto:') ? text.substring(7) : text;

    // Use the same email validation as in utils.ts
    return isEmail(email);
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
        // Only process text nodes that have the alightEmailLinkPluginHref attribute
        if (item.is('$text') && item.hasAttribute('alightEmailLinkPluginHref')) {
          // Try to extract organization name from the text - handle both with and without attributes
          const itemData = item.data;
          const match = itemData.match(/^(.*?)\s+\(([^)]+)\)$/);

          if (match && match[2]) {
            const orgName = match[2];

            // If the node doesn't have the org name attribute or it's different, update it
            if (!item.hasAttribute('alightEmailLinkPluginOrgName') ||
              item.getAttribute('alightEmailLinkPluginOrgName') !== orgName) {

              // Get the range of the entire link
              const href = item.getAttribute('alightEmailLinkPluginHref');
              const linkRange = this._getLinkRange(item, model);

              if (linkRange) {
                // Apply the organization name attribute to the entire link
                writer.setAttribute('alightEmailLinkPluginOrgName', orgName, linkRange);
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
        if (item.is('element', 'a') && item.getAttribute('data-id') === 'email_editor') {
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
                    if (node && node.hasAttribute('alightEmailLinkPluginHref')) {
                      const range = this._getLinkRange(node, model);
                      if (range) {
                        modelWriter.setAttribute('alightEmailLinkPluginOrgName', orgName, range);
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
        const links = editorElement.querySelectorAll('a[data-id="email_editor"]:not([orgnameattr])');
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
                  viewItem.getAttribute('data-id') === 'email_editor' &&
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
   * Finds and converts standard mailto links in the editor content
   * to use the AlightEmailLinkPlugin
   */
  private _convertStandardMailtoLinks(): void {
    const editor = this.editor;
    const model = editor.model;

    // Find all links with mailto: in the model
    model.change(writer => {
      const root = model.document.getRoot();
      if (!root) return;

      const range = model.createRangeIn(root);

      for (const item of range.getItems()) {
        if (item.is('$text') && item.hasAttribute('linkHref')) {
          const href = item.getAttribute('linkHref');

          if (typeof href === 'string' && href.startsWith('mailto:')) {
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
              writer.setAttribute('alightEmailLinkPluginHref', href, linkRange);

              // Add organization name attribute if found
              if (orgName) {
                writer.setAttribute('alightEmailLinkPluginOrgName', orgName, linkRange);
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
  private _getLinkRange(textNode: any, model: any): Range | null {
    const href = textNode.getAttribute('linkHref') || textNode.getAttribute('alightEmailLinkPluginHref');

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
        pos.parent.previousSibling.getAttribute('alightEmailLinkPluginHref') === href)) {
      pos = model.createPositionBefore(pos.parent.previousSibling);
    }

    // Extend to next nodes with the same link
    pos = endPos;
    while (pos.parent.nextSibling &&
      pos.parent.nextSibling.is('$text') &&
      (pos.parent.nextSibling.getAttribute('linkHref') === href ||
        pos.parent.nextSibling.getAttribute('alightEmailLinkPluginHref') === href)) {
      endPos = model.createPositionAfter(pos.parent.nextSibling);
      pos = endPos;
    }

    return model.createRange(startPos, endPos);
  }
}
