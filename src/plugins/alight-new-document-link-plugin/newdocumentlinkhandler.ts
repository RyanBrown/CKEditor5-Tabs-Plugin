// src/plugins/alight-new-document-link-plugin/NewDocumentLinkHandler.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Range, ViewElement } from '@ckeditor/ckeditor5-engine';
import AlightNewDocumentLinkPluginEditing from './linkediting';

/**
 * Document Link Handler plugin to ensure document links are processed
 * through the Alight Document Link UI.
 */
export default class NewDocumentLinkHandler extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightNewDocumentLinkPluginEditing] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'NewDocumentLinkHandler' as const;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;

    // Override the standard link command
    this._interceptLinkCommands();

    // Monitor for conflicting link attributes and resolve them
    this._handleConflictingLinks();
  }

  /**
   * Intercepts the standard link commands to redirect document links
   * to the AlightNewDocumentLinkPlugin.
   */
  private _interceptLinkCommands(): void {
    const editor = this.editor;

    // Get the original commands
    const originalLinkCommand = editor.commands.get('link');
    const alightNewDocumentLinkCommand = editor.commands.get('alight-new-document-link');

    if (!originalLinkCommand || !alightNewDocumentLinkCommand) {
      return;
    }

    // Monkey patch the execute method of the link command
    const originalExecute = originalLinkCommand.execute;
    originalLinkCommand.execute = function (href: string, options = {}) {
      // Check if this is a document link format (folder/document pattern)
      const isDocumentLink = href && typeof href === 'string' &&
        (href.match(/[A-Za-z0-9\s]+\/[A-Za-z0-9\-_]+$/) !== null);

      if (isDocumentLink) {
        // Execute our custom command instead
        editor.execute('alight-new-document-link', href, options);
      } else {
        // For non-document links, use the original behavior
        originalExecute.call(this, href, options);
      }
    };
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
          // Check for conflicting attributes (both linkHref and alightNewDocumentLinkPluginHref)
          if (item.is('$text') &&
            item.hasAttribute('linkHref') &&
            item.hasAttribute('alightNewDocumentLinkPluginHref')) {

            const linkHref = item.getAttribute('linkHref');
            const documentLinkHref = item.getAttribute('alightNewDocumentLinkPluginHref');

            // If it's a document link, keep only our attribute
            if (linkHref && typeof linkHref === 'string' &&
              documentLinkHref && typeof documentLinkHref === 'string' &&
              documentLinkHref.includes('/')) {
              writer.removeAttribute('linkHref', item);
            } else {
              // Otherwise, keep the standard link attribute
              writer.removeAttribute('alightNewDocumentLinkPluginHref', item);
            }
          }
        }
      });
    });
  }

  /**
   * Gets the range for a link
   */
  private _getLinkRange(textNode: any, model: any): Range | null {
    const href = textNode.getAttribute('linkHref') || textNode.getAttribute('alightNewDocumentLinkPluginHref');

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
        pos.parent.previousSibling.getAttribute('alightNewDocumentLinkPluginHref') === href)) {
      pos = model.createPositionBefore(pos.parent.previousSibling);
    }

    // Extend to next nodes with the same link
    pos = endPos;
    while (pos.parent.nextSibling &&
      pos.parent.nextSibling.is('$text') &&
      (pos.parent.nextSibling.getAttribute('linkHref') === href ||
        pos.parent.nextSibling.getAttribute('alightNewDocumentLinkPluginHref') === href)) {
      endPos = model.createPositionAfter(pos.parent.nextSibling);
      pos = endPos;
    }

    return model.createRange(startPos, endPos);
  }
}
