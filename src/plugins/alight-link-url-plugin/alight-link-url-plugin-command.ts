// src/plugins/alight-link-url-plugin/alight-link-url-plugin-command.ts
import { Command, Editor } from '@ckeditor/ckeditor5-core';
import { Writer } from '@ckeditor/ckeditor5-engine';
import { CKAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

// Options passed to the `execute()` method to set/remove a link.
interface LinkCommandOptions {
  href?: string;
  orgNameText?: string;
}

// Extends AlightDialogModalCommand, but also implements link-specific logic:
//  - refresh() sets isEnabled/value
//  - execute() sets up modal content and handles applying the link
export default class AlightLinkUrlPluginCommand extends Command {
  private dialog: CKAlightModalDialog | null = null;

  constructor(editor: Editor) {
    super(editor);
  }

  // `execute(options)`: We override the base command's method so we can
  // set up dynamic form content and then show the modal.
  public override execute(options: LinkCommandOptions = {}): void {
    const { href = '', orgNameText = '' } = options;

    // Create modal dialog
    this.dialog = new CKAlightModalDialog({
      width: '500px',
      modal: true,
      draggable: false,
      maximizable: false,
    });

    // Set title and content
    this.dialog.setTitle('Insert/Edit Link');
    this.dialog.setContent(`
      <div class="ck-custom-modal-content">
        <div class="form-group">
          <label for="linkUrl" class="cka-input-label">URL:</label>
          <input
            class="cka-input-text"
            id="linkUrl"
            placeholder="https://example.com"
            type="url"
            value="${href}" />
        </div>

        <div class="form-group">
          <label for="orgNameText" class="cka-input-label">Org Name</label>
          <input
            class="cka-input-text"
            id="orgNameText"
            placeholder="Organization Name"
            type="text"
            value="${orgNameText}" />
        </div>
      </div>
    `);

    // Set footer with buttons
    this.dialog.setFooter(`
      <div class="cka-dialog-footer-buttons">
        <button class="cka-button cka-button-rounded cka-button-outlined" id="cancelBtn">Cancel</button>
        <button class="cka-button cka-button-rounded" id="applyBtn">Apply</button>
      </div>
    `);

    // Add event listeners
    const content = this.dialog.getContentElement();
    if (content) {
      const cancelBtn = content.parentElement?.querySelector('#cancelBtn');
      const applyBtn = content.parentElement?.querySelector('#applyBtn');

      cancelBtn?.addEventListener('click', () => this.closeDialog());
      applyBtn?.addEventListener('click', () => this.applyLink());
    }

    // Show dialog
    this.dialog.show();
  }

  private closeDialog(): void {
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = null;
    }
  }

  private applyLink(): void {
    if (!this.dialog) return;

    const content = this.dialog.getContentElement();
    if (!content) return;

    const urlInput = content.querySelector('#linkUrl') as HTMLInputElement;
    const orgNameInput = content.querySelector('#orgNameText') as HTMLInputElement;

    const hrefValue = urlInput?.value.trim() || '';
    const orgNameTextValue = orgNameInput?.value.trim() || '';

    // Apply the link
    const model = this.editor.model;
    model.change((writer: Writer) => {
      const selection = model.document.selection;
      if (selection) {
        const range = selection.getFirstRange()!;

        if (hrefValue) {
          writer.setAttribute('linkHref', hrefValue, range);
          writer.setAttribute('orgNameText', orgNameTextValue, range);
        } else {
          writer.removeAttribute('linkHref', range);
          writer.removeAttribute('orgNameText', range);
        }

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

    this.closeDialog();
  }

  // `refresh()` sets `isEnabled` and `value` based on the current selection.
  public override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    // isEnabled if we have a non-collapsed selection
    this.isEnabled = !!selection.rangeCount && !selection.isCollapsed;

    // If there's a linkHref on the selection, store it in `value`.
    const href = selection.getAttribute('linkHref') as string | undefined;
    const orgNameText = selection.getAttribute('orgNameText') as string | undefined;
    this.value = href ? { href, orgNameText } : null;
  }
}
