// src/plugins/alight-copy-plugin/alight-copy-plugin-command.ts
import { Editor } from '@ckeditor/ckeditor5-core';
import Command from '@ckeditor/ckeditor5-core/src/command';
import { Notification } from '@ckeditor/ckeditor5-ui';
import { DocumentSelection } from '@ckeditor/ckeditor5-engine';

export default class alightCopyPluginPluginCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  override execute(): void {
    const editor = this.editor;
    const selection = editor.model.document.selection;

    // Get selected content
    const selectedContent = this._getSelectedContent(selection);

    if (selectedContent) {
      this._copyToClipboard(selectedContent);
    }
  }

  override refresh(): void {
    const selection = this.editor.model.document.selection;

    // Enable command only when there's a non-collapsed selection
    this.isEnabled = !selection.isCollapsed;
  }

  private _getSelectedContent(selection: DocumentSelection): string {
    const editor = this.editor;
    const viewFragment = editor.data.toView(editor.model.getSelectedContent(selection));
    const domFragment = editor.data.processor.toData(viewFragment);

    return domFragment;
  }

  private async _copyToClipboard(content: string): Promise<void> {
    try {
      // Try using the modern Clipboard API first
      const type = 'text/html';
      const blob = new Blob([content], { type });
      const data = [new ClipboardItem({ [type]: blob })];

      try {
        await navigator.clipboard.write(data);
      } catch (clipboardError) {
        // Fallback for browsers that don't support clipboard.write()
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.innerHTML = content;
        document.body.appendChild(tempContainer);

        // Create a range and selection
        const range = document.createRange();
        range.selectNodeContents(tempContainer);

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);

          // Try the execCommand as a fallback
          document.execCommand('copy');

          // Clean up selection
          selection.removeAllRanges();
        }

        // Clean up container
        document.body.removeChild(tempContainer);
      }

      // Show success notification
      const notification = this.editor.plugins.get('Notification') as any;
      notification.show('Content copied with styles!', {
        type: 'success',
        namespace: 'alightCopyPlugin'
      });
    } catch (error) {
      console.error('Error copying content:', error);

      // Show error notification
      const notification = this.editor.plugins.get('Notification') as any;
      notification.show('Failed to copy content. Please try again.', {
        type: 'error',
        namespace: 'alightCopyPlugin'
      });
    }
  }
}
