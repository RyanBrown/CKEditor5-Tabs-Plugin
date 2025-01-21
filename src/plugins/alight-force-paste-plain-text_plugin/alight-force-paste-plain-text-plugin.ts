import { Plugin, Editor } from '@ckeditor/ckeditor5-core';

export default class AlightForcePastePlainText extends Plugin {
    init() {
        const editor = this.editor;

        // Force paste as plain text by intercepting the paste event
        editor.editing.view.document.on(
            'clipboardInput',
            (evt, data) => {
                // Retrieve plain text data from the clipboard
                let plainText = data.dataTransfer.getData('text/plain');

                // Split the text into lines and wrap each in a <p> tag like ckeditor does by default
                const wrappedText = plainText
                    .split(/\n/)
                    .map((line: any) => `<p>${line}</p>`)
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
