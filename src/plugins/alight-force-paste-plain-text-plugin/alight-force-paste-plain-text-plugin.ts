import { Plugin } from '@ckeditor/ckeditor5-core';

// AlightForcePastePlainText plugin forces pasting content as plain text, preserving line breaks. 
export default class AlightForcePastePlainText extends Plugin {
  // Add this static property
  public static readonly pluginName = 'AlightForcePastePlainText';

  init() {
    const editor = this.editor;

    // Force paste as plain text by intercepting the paste event
    editor.editing.view.document.on(
      'clipboardInput',
      (evt, data) => {
        // Retrieve plain text data from the clipboard
        let plainText = data.dataTransfer.getData('text/plain');

        // Split the plain text into lines and wrap each in a <p> tag like ckeditor does by default
        const wrappedText = plainText
          .split(/\n/)
          .map((line: string) => `<p>${line}</p>`)
          .join('');

        // Convert the plain text to a view fragment
        const viewFragment = editor.data.processor.toView(wrappedText);
        const modelFragment = editor.data.toModel(viewFragment);

        // Insert the modified content into the editor
        editor.model.insertContent(modelFragment);

        // Stop the default handling to prevent additional processing
        evt.stop();
      },
      { priority: 'high' }
    );
  }
}
