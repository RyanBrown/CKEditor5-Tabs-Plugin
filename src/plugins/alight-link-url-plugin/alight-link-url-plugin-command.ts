// src/plugins/alight-link-url-plugin/alight-link-url-plugin-command.ts

import { Writer } from '@ckeditor/ckeditor5-engine';
import type { Editor } from '@ckeditor/ckeditor5-core';

import AlightDialogModalCommand from './../alight-dialog-modal/alight-dialog-modal-command';

/**
 * Options passed to the `execute()` method to set/remove a link.
 */
interface LinkCommandOptions {
  href?: string;
}

/**
 * Extends AlightDialogModalCommand, but also implements link-specific logic:
 *  - refresh() sets isEnabled/value
 *  - execute() sets up modal content and handles applying the link
 */
export default class AlightLinkUrlCommand extends AlightDialogModalCommand {
  constructor(editor: Editor) {
    // Build default "shell" props for the modal. The actual <input> can be inserted later.
    super(editor, {
      title: 'Insert/Edit Link',
      content: '', // We'll inject the actual HTML form in execute()
      primaryButton: {
        label: 'Apply',
        onClick: () => {
          // 1) Read the <input> value from the modal
          const urlInput = document.getElementById('linkUrl') as HTMLInputElement | null;
          const hrefValue = urlInput?.value.trim() || '';

          // 2) Insert or remove linkHref
          const model = this.editor.model;
          model.change((writer: Writer) => {
            const selection = model.document.selection;
            if (selection) {
              if (hrefValue) {
                writer.setAttribute('linkHref', hrefValue, selection.getFirstRange()!);
              } else {
                writer.removeAttribute('linkHref', selection.getFirstRange()!);
              }
            }
          });

          // Close the modal
          this.closeModal();
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => this.closeModal()
      }
    });
  }

  /**
   * `execute(options)`: We override the base command's method so we can
   * set up dynamic form content and then show the modal.
   */
  public override execute(options: LinkCommandOptions = {}): void {
    const { href = '' } = options;

    // Insert a minimal HTML form into `modalProps.content`.
    // This could be replaced with a more elaborate form (org-name, etc.)
    this.modalProps.content = `
      <div class="ck-custom-modal-content">
        <label>URL: <input type="text" id="linkUrl" value="${href}" /></label>
      </div>
    `;

    // Finally, call the parent's .execute() to open the modal
    super.execute();
  }

  /**
   * `refresh()` sets `isEnabled` and `value` based on the current selection.
   */
  public override refresh(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    // isEnabled if we have a non-collapsed selection
    this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;

    // If there's a linkHref on the selection, store it in `value`.
    const href = selection.getAttribute('linkHref') as string | undefined;
    this.value = href ? { href } : null;
  }
}
