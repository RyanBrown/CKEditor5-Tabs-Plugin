// src/plugins/alight-new-document-link-plugin/autolink.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { ClipboardInputTransformationData } from '@ckeditor/ckeditor5-clipboard';
import type { DocumentSelectionChangeEvent, Element, Model, Position, Range, Writer } from '@ckeditor/ckeditor5-engine';
import { Delete, TextWatcher, getLastTextLine, findAttributeRange, type TextWatcherMatchedDataEvent } from '@ckeditor/ckeditor5-typing';
import type { EnterCommand, ShiftEnterCommand } from '@ckeditor/ckeditor5-enter';

import { addLinkProtocolIfApplicable, linkHasProtocol } from './utils';
import AlightNewDocumentLinkPluginEditing from './linkediting';

const MIN_LINK_LENGTH_WITH_SPACE_AT_END = 4; // Ie: "t.co " (length 5).

// Improved email detection regex
const EMAIL_REG_EXP = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

/**
 * Enhanced autolink plugin with better email detection
 */
export default class AlightNewDocumentAutoLink extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [Delete, AlightNewDocumentLinkPluginEditing] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightNewDocumentAutoLink' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    selection.on<DocumentSelectionChangeEvent>('change:range', () => {
      // Disable plugin when selection is inside a code block.
      this.isEnabled = !selection.anchor!.parent.is('element', 'codeBlock');
    });

    this._enableTypingHandling();
    this._enableEmailDetection();
  }

  /**
   * @inheritDoc
   */
  public afterInit(): void {
    this._enableEnterHandling();
    this._enableShiftEnterHandling();
    this._enablePasteLinking();
  }

  /**
   * Enables special handling for email addresses
   */
  private _enableEmailDetection(): void {
    const editor = this.editor;
    const clipboardPipeline = editor.plugins.get('ClipboardPipeline');

    // Listen for paste events
    clipboardPipeline.on('inputTransformation', (evt, data: ClipboardInputTransformationData) => {
      if (!this.isEnabled || data.method !== 'paste') {
        return;
      }

      const text = data.dataTransfer.getData('text/plain');

      // Check if the pasted text is an email address
      if (text && EMAIL_REG_EXP.test(text.trim())) {
        // Don't create the new document link yet, just let the email be pasted
        // We'll detect it in the document and auto-link it
        setTimeout(() => {
          this._detectAndLinkEmails();
        }, 0);
      }
    });
  }

  /**
   * Searches the document for unlinked email addresses and converts them to mailto: links
   */
  private _detectAndLinkEmails(): void {
    const editor = this.editor;
    const model = editor.model;

    model.change(writer => {
      const range = model.createRangeIn(model.document.getRoot()!);

      for (const item of range.getItems()) {
        if (item.is('$text') && !item.hasAttribute('alightNewDocumentLinkPluginHref')) {
          const text = item.data;

          // Look for email pattern in the text
          const match = text.match(EMAIL_REG_EXP);

          if (match) {
            const email = match[0];
            const startIndex = text.indexOf(email);
            const endIndex = startIndex + email.length;

            // Create range for the email part
            const start = model.createPositionAt(item.parent!, item.startOffset! + startIndex);
            const end = model.createPositionAt(item.parent!, item.startOffset! + endIndex);
            const emailRange = model.createRange(start, end);

            // Add mailto: prefix and set attribute
            writer.setAttribute('alightNewDocumentLinkPluginHref', 'mailto:' + email, emailRange);
          }
        }
      }
    });
  }

  /**
   * For given position, returns a range that includes the whole link that contains the position.
   *
   * If position is not inside a link, returns `null`.
   */
  private _expandLinkRange(model: Model, position: Position): Range | null {
    if (position.textNode && position.textNode.hasAttribute('alightNewDocumentLinkPluginHref')) {
      return findAttributeRange(position, 'alightNewDocumentLinkPluginHref', position.textNode.getAttribute('alightNewDocumentLinkPluginHref'), model);
    } else {
      return null;
    }
  }

  /**
   * Extends the document selection to includes all links that intersects with given `selectedRange`.
   */
  private _selectEntireLinks(writer: Writer, selectedRange: Range): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const selStart = selection.getFirstPosition()!;
    const selEnd = selection.getLastPosition()!;

    let updatedSelection = selectedRange.getJoined(this._expandLinkRange(model, selStart) || selectedRange);
    if (updatedSelection) {
      updatedSelection = updatedSelection.getJoined(this._expandLinkRange(model, selEnd) || selectedRange);
    }

    if (updatedSelection && (updatedSelection.start.isBefore(selStart) || updatedSelection.end.isAfter(selEnd))) {
      // Only update the selection if it changed.
      writer.setSelection(updatedSelection);
    }
  }

  /**
   * Enables autolinking on pasting a URL when some content is selected.
   */
  private _enablePasteLinking(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const clipboardPipeline = editor.plugins.get('ClipboardPipeline');
    const AlightNewDocumentLinkPluginCommand = editor.commands.get('alight-new-document-link')!;

    clipboardPipeline.on('inputTransformation', (evt, data: ClipboardInputTransformationData) => {
      if (!this.isEnabled || !AlightNewDocumentLinkPluginCommand.isEnabled || selection.isCollapsed || data.method !== 'paste') {
        // Abort if we are disabled or the selection is collapsed.
        return;
      }

      if (selection.rangeCount > 1) {
        // Abort if there are multiple selection ranges.
        return;
      }

      const selectedRange = selection.getFirstRange()!;

      const newLink = data.dataTransfer.getData('text/plain');

      if (!newLink) {
        return;
      }

      // Check if it's an email address
      if (EMAIL_REG_EXP.test(newLink.trim())) {
        model.change(writer => {
          this._selectEntireLinks(writer, selectedRange);
          AlightNewDocumentLinkPluginCommand.execute('mailto:' + newLink.trim());
        });

        evt.stop();
        return;
      }

      // Handle regular URLs (original logic)
      const matches = newLink.match(/^(https?:\/\/|www\.)\S+$/i);

      // If the text in the clipboard has a URL, and that URL is the whole clipboard.
      if (matches && matches[0] === newLink) {
        model.change(writer => {
          this._selectEntireLinks(writer, selectedRange);
          AlightNewDocumentLinkPluginCommand.execute(newLink);
        });

        evt.stop();
      }
    }, { priority: 'high' });
  }

  /**
   * Enables autolinking on typing.
   */
  private _enableTypingHandling(): void {
    const editor = this.editor;

    const watcher = new TextWatcher(editor.model, text => {
      let mappedText = text;

      // 1. Detect <kbd>Space</kbd> after a text with a potential link.
      if (!isSingleSpaceAtTheEnd(mappedText)) {
        return;
      }

      // 2. Remove the last space character.
      mappedText = mappedText.slice(0, -1);

      // 3. Remove punctuation at the end of the URL if it exists.
      if ('!.:,;?'.includes(mappedText[mappedText.length - 1])) {
        mappedText = mappedText.slice(0, -1);
      }
      // Detect folder/document format
      const match = text.match(/[A-Za-z0-9\s]+\/[A-Za-z0-9\-_]+$/);

      // 4. First check for email
      if (match) {
        return {
          url: match[0],
          removedTrailingCharacters: text.length - match[0].length,
          isDocumentLink: true
        };
      }
    });

    watcher.on<TextWatcherMatchedDataEvent<{ url: string; removedTrailingCharacters: number; isEmail?: boolean }>>('matched:data', (evt, data) => {
      const { batch, range, url, removedTrailingCharacters, isEmail } = data;

      if (!batch.isTyping) {
        return;
      }

      const linkEnd = range.end.getShiftedBy(-removedTrailingCharacters); // Executed after a space character or punctuation.
      const linkStart = linkEnd.getShiftedBy(-url.length);

      const linkRange = editor.model.createRange(linkStart, linkEnd);

      // For emails, always add mailto: prefix
      if (isEmail) {
        this._applyAutoLink('mailto:' + url, linkRange);
      } else {
        this._applyAutoLink(url, linkRange);
      }
    });

    watcher.bind('isEnabled').to(this);
  }

  /**
   * Enables autolinking on the <kbd>Enter</kbd> key.
   */
  private _enableEnterHandling(): void {
    const editor = this.editor;
    const model = editor.model;
    const enterCommand: EnterCommand | undefined = editor.commands.get('enter');

    if (!enterCommand) {
      return;
    }

    enterCommand.on('execute', () => {
      const position = model.document.selection.getFirstPosition()!;

      if (!position.parent.previousSibling) {
        return;
      }

      const rangeToCheck = model.createRangeIn(position.parent.previousSibling as Element);

      this._checkAndApplyAutoLinkOnRange(rangeToCheck);
    });
  }

  /**
   * Enables autolinking on the <kbd>Shift</kbd>+<kbd>Enter</kbd> keyboard shortcut.
   */
  private _enableShiftEnterHandling(): void {
    const editor = this.editor;
    const model = editor.model;

    const shiftEnterCommand: ShiftEnterCommand | undefined = editor.commands.get('shiftEnter');

    if (!shiftEnterCommand) {
      return;
    }

    shiftEnterCommand.on('execute', () => {
      const position = model.document.selection.getFirstPosition()!;

      const rangeToCheck = model.createRange(
        model.createPositionAt(position.parent, 0),
        position.getShiftedBy(-1)
      );

      this._checkAndApplyAutoLinkOnRange(rangeToCheck);
    });
  }

  /**
   * Checks if the passed range contains a linkable text.
   */
  private _checkAndApplyAutoLinkOnRange(rangeToCheck: Range): void {
    const model = this.editor.model;
    const { text, range } = getLastTextLine(rangeToCheck, model);

    // First check for email
    if (EMAIL_REG_EXP.test(text)) {
      const linkRange = model.createRange(
        range.start,
        range.end
      );

      this._applyAutoLink('mailto:' + text, linkRange);
      return;
    }

    // Then check for URL
    const url = getUrlAtTextEnd(text);

    if (url) {
      const linkRange = model.createRange(
        range.end.getShiftedBy(-url.length),
        range.end
      );

      this._applyAutoLink(url, linkRange);
    }
  }

  /**
   * Applies a link on a given range if the link should be applied.
   *
   * @param url The URL to link.
   * @param range The text range to apply the link attribute to.
   */
  private _applyAutoLink(url: string, range: Range): void {
    const model = this.editor.model;

    const defaultProtocol = this.editor.config.get('link.defaultProtocol');
    const fullUrl = addLinkProtocolIfApplicable(url, defaultProtocol);

    if (!this.isEnabled || !isLinkAllowedOnRange(range, model) || (url.startsWith('mailto:') ? false : !linkHasProtocol(fullUrl)) || linkIsAlreadySet(range)) {
      return;
    }

    this._persistAutoLink(fullUrl, range);
  }

  /**
   * Enqueues autolink changes in the model.
   *
   * @param url The URL to link.
   * @param range The text range to apply the link attribute to.
   */
  private _persistAutoLink(url: string, range: Range): void {
    const model = this.editor;
    const deletePlugin = this.editor.plugins.get('Delete');

    // Enqueue change to make undo step.
    model.model.enqueueChange(writer => {
      writer.setAttribute('alightNewDocumentLinkPluginHref', url, range);

      model.model.enqueueChange(() => {
        deletePlugin.requestUndoOnBackspace();
      });
    });
  }
}

// Check if text should be evaluated by the plugin in order to reduce number of RegExp checks on whole text.
function isSingleSpaceAtTheEnd(text: string): boolean {
  return text.length > MIN_LINK_LENGTH_WITH_SPACE_AT_END && text[text.length - 1] === ' ' && text[text.length - 2] !== ' ';
}

function getUrlAtTextEnd(text: string): string | null {
  // Check for URL pattern
  const urlMatch = text.match(/(?:https?:\/\/|www\.)[^\s]+$/i);

  return urlMatch ? urlMatch[0] : null;
}

function isLinkAllowedOnRange(range: Range, model: Model): boolean {
  return model.schema.checkAttributeInSelection(model.createSelection(range), 'alightNewDocumentLinkPluginHref');
}

function linkIsAlreadySet(range: Range): boolean {
  const item = range.start.nodeAfter;
  return !!item && item.hasAttribute('alightNewDocumentLinkPluginHref');
}
