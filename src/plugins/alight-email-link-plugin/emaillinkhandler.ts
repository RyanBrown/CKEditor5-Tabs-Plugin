// src/plugins/alight-email-link-plugin/emaillinkhandler.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightEmailLinkPluginEditing from './linkediting';

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

    // Handle pasted mailto: links
    this._enableMailtoLinkDetection();
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
    originalLinkCommand.execute = function (href, options = {}) {
      // If the link is a mailto link, use our custom email link command
      if (href && typeof href === 'string' && (href.startsWith('mailto:') ||
        href.includes('@') && !href.includes('://') && !href.startsWith('/'))) {

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
    });
  }

  /**
   * Checks if a string is a valid email address
   */
  private _isEmailAddress(text: string): boolean {
    // Remove mailto: prefix for validation
    const email = text.startsWith('mailto:') ? text.substring(7) : text;

    // Simple email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
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
      const range = model.createRangeIn(model.document.getRoot()!);

      for (const item of range.getItems()) {
        if (item.is('$text') && item.hasAttribute('linkHref')) {
          const href = item.getAttribute('linkHref');

          if (typeof href === 'string' && href.startsWith('mailto:')) {
            // Get the link range
            const linkRange = this._getMailtoLinkRange(item, model);

            if (linkRange) {
              // Remove the standard link attribute
              writer.removeAttribute('linkHref', linkRange);

              // Apply our custom link attribute
              writer.setAttribute('alightEmailLinkPluginHref', href, linkRange);
            }
          }
        }
      }
    });
  }

  /**
   * Gets the range for a mailto link
   */
  private _getMailtoLinkRange(textNode: any, model: any): any {
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