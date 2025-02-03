// src/plugins/alight-link-url-plugin/alight-link-url-plugin-command.ts
import { Writer } from '@ckeditor/ckeditor5-engine';
import type { Editor } from '@ckeditor/ckeditor5-core';
import AlightDialogModalCommand from './../alight-dialog-modal/alight-dialog-modal-command';

// Options passed to the `execute()` method to set/remove a link.
interface LinkCommandOptions {
  href?: string;
  orgNameText?: string;
}

// Extends AlightDialogModalCommand, but also implements link-specific logic:
//  - refresh() sets isEnabled/value
//  - execute() sets up modal content and handles applying the link
export default class AlightLinkUrlPluginCommand extends AlightDialogModalCommand {
  constructor(editor: Editor) {
    // Build default "shell" props for the modal. The actual <input> can be inserted later.
    super(editor, {
      title: 'Insert/Edit Link',
      content: '', // We'll inject the actual HTML form in execute()
      primaryButton: {
        label: 'Apply',
        onClick: () => {
          // 1) Read the <input> values from the modal
          const urlInput = document.getElementById('linkUrl') as HTMLInputElement | null;
          const hrefValue = urlInput?.value.trim() || '';
          const orgNameTextInput = document.getElementById('orgNameText') as HTMLInputElement | null;
          const orgNameTextValue = orgNameTextInput?.value.trim() || '';

          // 2) Insert or remove linkHref and orgNameText
          const model = this.editor.model;
          model.change((writer: Writer) => {
            const selection = model.document.selection;
            if (selection) {
              // Get the selected text content
              const range = selection.getFirstRange()!;

              // Apply link attributes to the selected range
              if (hrefValue) {
                writer.setAttribute('linkHref', hrefValue, range);
                writer.setAttribute('orgNameText', orgNameTextValue, range);
              } else {
                writer.removeAttribute('linkHref', range);
                writer.removeAttribute('orgNameText', range);
              }

              // Append organization name after the selected text in a span
              if (orgNameTextValue) {
                const orgText = writer.createText(` (${orgNameTextValue})`);
                const orgSpan = writer.createElement('orgNameSpan', {
                  class: 'org-name-append',
                  linkHref: hrefValue || null
                });
                writer.insert(orgSpan, range.end);
                writer.insert(orgText, orgSpan);
              }
            }
          });

          this.closeModal();
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => this.closeModal()
      }
    });
  }


  // `execute(options)`: We override the base command's method so we can
  // set up dynamic form content and then show the modal.
  public override execute(options: LinkCommandOptions = {}): void {
    const { href = '', orgNameText = '' } = options;

    // Insert a minimal HTML form into `modalProps.content`.
    this.modalProps.content = `
      <div class="ck-custom-modal-content">
        <label for="linkUrl" class="cka-input-text">URL:</label>
        <input
          class="cka-input-text"
          id="linkUrl"
          placeholder="https://example.com"
          type="url"
          value="${href}" />

        <label for="orgNameText" class="cka-input-text mt-4">Org Name</label>
        <input
          class="cka-input-text"
          id="orgNameText"
          placeholder="Organization Name"
          type="text"
          value="${orgNameText}" />
      </div>
    `;

    // Finally, call the parent's .execute() to open the modal
    super.execute();
  }

  // `refresh()` sets `isEnabled` and `value` based on the current selection.
  public override refresh(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;

    // isEnabled if we have a non-collapsed selection
    this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;

    // If there's a linkHref on the selection, store it in `value`.
    const href = selection.getAttribute('linkHref') as string | undefined;
    const orgNameText = selection.getAttribute('orgNameText') as string | undefined;
    this.value = href ? { href, orgNameText } : null;
  }
}
