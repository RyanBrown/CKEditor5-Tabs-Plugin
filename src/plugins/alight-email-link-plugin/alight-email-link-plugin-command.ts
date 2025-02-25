// src/plugins/alight-email-link-plugin/alight-email-link-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import { Item } from '@ckeditor/ckeditor5-engine';
import { OrganizationNameHandler, normalizeEmailAddress, getSelectedLinkElement } from './alight-email-link-plugin-utils';

// Interface for command options when applying an email link.
export interface AlightEmailLinkPluginCommandOptions {
  email: string;
  orgName?: string;
}

// Command for applying and managing email links within the editor.
export default class AlightEmailLinkPluginCommand extends Command {
  public readonly orgNameHandler: OrganizationNameHandler;

  /**
   * Creates a new AlightEmailLinkPluginCommand.
   * @param editor The CKEditor instance
   */
  constructor(editor: any) {
    super(editor);
    this.orgNameHandler = new OrganizationNameHandler(editor);
  }

  /**
   * Executes the command to apply or update an email link.
   * @param options The options containing email and optional organization name
   */
  override execute(options: AlightEmailLinkPluginCommandOptions): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const { email, orgName } = options;

    // Normalize the email to ensure it has mailto: prefix
    const normalizedEmail = normalizeEmailAddress(email);

    model.change(writer => {
      // Check if we're in edit mode by seeing if a link is currently selected
      const isEditMode = editor.commands.get('link')?.value;

      if (isEditMode) {
        this._handleEditMode(writer, selection, normalizedEmail, orgName);
      } else {
        this._handleCreateMode(writer, selection, normalizedEmail, orgName);
      }
    });
  }

  /**
   * Handles updating an existing link.
   * 
   * @param writer The model writer
   * @param selection The current selection
   * @param email The normalized email (with mailto: prefix)
   * @param orgName The optional organization name
   */
  private _handleEditMode(writer: any, selection: any, email: string, orgName?: string): void {
    const editor = this.editor;
    console.log('DEBUG: _handleEditMode called with:', { email, orgName });

    const range = selection.getFirstRange();
    if (!range) {
      console.log('DEBUG: No range found in selection');
      return;
    }

    // Get the current link element and its text
    const linkElement = getSelectedLinkElement(editor);
    if (!linkElement) {
      console.log('DEBUG: No link element found in selection');
      return;
    }

    // Get the full text content from the model
    let selectedText = '';
    try {
      const selectedContent = editor.model.getSelectedContent(selection);
      console.log('DEBUG: Selected content:', selectedContent);

      // Extract ytext from the selected content
      for (const child of selectedContent.getChildren()) {
        if ('data' in child) {
          selectedText += child.data;
        }
      }
    } catch (error) {
      console.log('DEBUG: Error getting selected text:', error);
    }

    // Ensure selectedText is not empty
    if (!selectedText) {
      console.log('DEBUG: Selected text is empty');
      return;
    }

    console.log('DEBUG: Link text from model:', selectedText);

    // Function to update the orgNam in the selected text
    function updateOrgName(selectedText: string, orgName?: string): string {
      const orgNameRegex = /\s\(([^)]+)\)$/;
      let newText = selectedText;

      if (orgName) {
        if (orgNameRegex.test(selectedText)) {
          newText = selectedText.replace(orgNameRegex, ` (${orgName})`);
        } else {
          newText = `${selectedText} (${orgName})`;
        }
        console.log('DEBUG: Updating organization name:', { selectedText, orgName, newText });
      } else {
        console.log('DEBUG: No org name provided, using selected text:', selectedText);
      }

      return newText;
    }

    const newText = updateOrgName(selectedText, orgName);

    // Only update if the text has changed
    if (newText !== selectedText) {
      console.log('DEBUG: Text has changed, updating content');

      // Remove the existing link first
      editor.execute('unlink');

      // Insert the updated text
      writer.insertText(newText, range.start);

      // Create a selection for the new text
      const newEnd = range.start.getShiftedBy(newText.length);
      const newRange = writer.createRange(range.start, newEnd);
      writer.setSelection(newRange);

      // Apply the link (with mailto:)
      console.log('DEBUG: Applying link to:', newText);
      editor.execute('link', email);
    } else {
      console.log('DEBUG: Text has not changed');
    }
  }

  /**
   * Handles creating a new link when none exists.
   * 
   * @param writer The model writer
   * @param selection The current selection
   * @param email The normalized email (with mailto: prefix)
   * @param orgName The optional organization name
   */
  private _handleCreateMode(writer: any, selection: any, email: string, orgName?: string): void {
    const editor = this.editor;
    console.log('DEBUG: _handleCreateMode called with:', { email, orgName, isCollapsed: selection.isCollapsed });

    if (!selection.isCollapsed) {
      // Text is already selected
      const range = selection.getFirstRange();

      if (!range) {
        console.log('DEBUG: No range found in selection');
        return;
      }

      // Get the selected text directly from the editor's model
      let selectedText = '';
      try {
        const selectedContent = editor.model.getSelectedContent(selection);
        if (selectedContent && selectedContent.childCount > 0) {
          const firstChild = selectedContent.getChild(0);
          if (firstChild && 'data' in firstChild) {
            selectedText = firstChild.data as string;
          }
        }
      } catch (error) {
        console.log('DEBUG: Error getting selected text:', error);
      }
      console.log('DEBUG: Selected text from model:', selectedText);

      // Check if the text already has an org name
      const orgNameRegex = / \([^)]+\)$/;
      const hasOrgName = orgNameRegex.test(selectedText);
      console.log('DEBUG: Has org name already:', hasOrgName);

      let textToLink = selectedText;

      // Add org name if needed
      if (orgName && !hasOrgName) {
        textToLink = `${selectedText} (${orgName})`;
        console.log('DEBUG: Adding org name, new text:', textToLink);

        // Remove the selected content
        writer.remove(range);

        // Insert the new text with org name
        writer.insertText(textToLink, range.start);

        // Create a new selection for the inserted text
        const newEnd = range.start.getShiftedBy(textToLink.length);
        const newRange = writer.createRange(range.start, newEnd);
        writer.setSelection(newRange);
      }

      // Apply the link to the selected text
      console.log('DEBUG: Applying link to:', textToLink);
      editor.execute('link', email);
    } else {
      // No text is selected, insert the email address with optional org name
      const displayText = orgName ? `${email.replace(/^mailto:/i, '')} (${orgName})` : email.replace(/^mailto:/i, '');
      console.log('DEBUG: Creating new link with email and org name:', { email: email.replace(/^mailto:/i, ''), orgName, displayText });

      const position = selection.getFirstPosition();
      if (position) {
        writer.insertText(displayText, position);

        // Select the newly inserted text
        const endPosition = position.getShiftedBy(displayText.length);
        writer.setSelection(writer.createRange(position, endPosition));

        // Apply the link
        editor.execute('link', email);
      }
    }
  }

  // Updates the command's enabled state based on the link command's state.
  override refresh(): void {
    const linkCommand = this.editor.commands.get('link');

    // AlightEmailLinkPluginCommand should be enabled when the regular link command is enabled
    this.isEnabled = linkCommand ? linkCommand.isEnabled : false;
  }

  // Removes an email link and any associated organization text.
  public removeEmailLink(): void {
    const editor = this.editor;

    editor.model.change(writer => {
      const selection = editor.model.document.selection;
      const range = selection.getFirstRange();

      if (range) {
        // Get the selected text with proper TypeScript type handling
        const selectedText = Array.from(range.getItems())
          .filter((item: any) => item.is && item.is('$text'))
          .map((item: any) => item.data)
          .join('');

        // Check if the text contains organization name
        const orgNameRegex = / \([^)]+\)$/;
        const hasOrgName = orgNameRegex.test(selectedText);

        if (hasOrgName) {
          // Remove the link first
          editor.execute('unlink');

          // Remove the organization name
          const baseText = selectedText.replace(orgNameRegex, '');

          // Remove the current content
          writer.remove(range);

          // Insert the text without the organization name
          writer.insertText(baseText, range.start);

          // Select the new text
          const newEnd = range.start.getShiftedBy(baseText.length);
          const newRange = writer.createRange(range.start, newEnd);
          writer.setSelection(newRange);

          return;
        }
      }

      // Just execute the unlink command if no org name was found
      editor.execute('unlink');
    });
  }
}