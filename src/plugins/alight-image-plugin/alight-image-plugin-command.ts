// alight-image-plugin-command.ts
import AlightDialogModalCommand from '../alight-dialog-modal/alight-dialog-modal-command';
import type Editor from '@ckeditor/ckeditor5-core/src/editor/editor';

// Example data interface
interface ImageOptionData {
  title: string;
  primaryButtonLabel?: string;
  loadContent?: () => Promise<string>;
}

/**
 * One approach: you can have a single "image command" that checks an option.
 * Or you can define separate commands for each "image option" (existing vs upload).
 */
export class AlightImagePluginCommand extends AlightDialogModalCommand {
  constructor(editor: Editor, data: ImageOptionData) {
    // Build dynamic content
    const { title, primaryButtonLabel = 'Continue', loadContent } = data;

    // Synchronously or asynchronously load content
    // For demonstration, let's assume the content can be loaded later:
    const modalProps = {
      title,
      content: 'Loading...',  // or a placeholder
      primaryButton: {
        label: primaryButtonLabel,
        onClick: () => {
          console.log('Primary action for image plugin');
          // Possibly do something with the editor here
        }
      },
      tertiaryButton: {
        label: 'Cancel',
        onClick: () => {
          console.log('Dismissed image modal');
        }
      },
      // We'll override execute() to handle loading if needed
    };

    super(editor, modalProps);

    // Optionally handle asynchronous content
    // If you want to fully handle async inside this constructor, you'd do:
    if (loadContent) {
      loadContent().then((loadedHTML) => {
        modalProps.content = loadedHTML;
      });
    }
  }
}
