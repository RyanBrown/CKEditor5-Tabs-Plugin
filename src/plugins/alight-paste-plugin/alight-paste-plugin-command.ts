// src/plugins/alight-paste-plugin/alight-paste-plugin-command.ts
import { Editor } from '@ckeditor/ckeditor5-core';
import Command from '@ckeditor/ckeditor5-core/src/command';

export default class AlightPastePluginCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  override refresh(): void {
    // Always enabled as paste can be performed at any cursor position
    this.isEnabled = true;
  }

  override async execute(): Promise<void> {
    const editor = this.editor;

    try {
      // Try to read from clipboard
      const clipboardItems = await navigator.clipboard.read();
      let content = '';

      for (const item of clipboardItems) {
        // Check for HTML content
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html');
          content = await blob.text();
          break;
        }
      }

      if (content) {
        // Insert the content at current selection
        const viewFragment = editor.data.processor.toView(content);
        const modelFragment = editor.data.toModel(viewFragment);

        editor.model.insertContent(modelFragment);

        // Show success notification
        const notification = editor.plugins.get('Notification');
        notification.showSuccess('Content pasted with styles!', {
          namespace: 'alightPastePlugin',
          title: 'Success'
        });
      } else {
        throw new Error('No HTML content found in clipboard');
      }
    } catch (error) {
      console.error('Error pasting content:', error);

      try {
        // Fallback: Try to get text content
        const text = await navigator.clipboard.readText();
        if (text) {
          const viewFragment = editor.data.processor.toView(text);
          const modelFragment = editor.data.toModel(viewFragment);

          editor.model.insertContent(modelFragment);

          // Show warning about fallback
          const notification = editor.plugins.get('Notification');
          notification.showWarning('Content pasted without styles.', {
            namespace: 'alightPastePlugin',
            title: 'Warning'
          });
        } else {
          throw new Error('No text content in clipboard');
        }
      } catch (fallbackError) {
        console.error('Fallback paste failed:', fallbackError);

        // Show error notification
        const notification = editor.plugins.get('Notification');
        notification.showWarning('Failed to paste content. Please try again.', {
          namespace: 'alightPastePlugin',
          title: 'Error'
        });
      }
    }
  }
}
