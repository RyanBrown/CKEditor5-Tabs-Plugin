import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightImagePluginCommand from './alight-image-plugin-command';
import { getExistingImageContent } from './modal-content/existing-image';
import { getUploadImageContent } from './modal-content/upload-image';

export default class AlightImagePluginEditing extends Plugin {
    init() {
        const editor = this.editor;

        // Define unique content for each link option
        const imageOptionsContent = {
            imageOption1: {
                title: 'Existing Image',
                content: '<div class="existing-image-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getExistingImageContent();
                },
            },
            imageOption2: {
                title: 'Upload Image',
                content: '<div class="upload-image-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getUploadImageContent();
                },
            },
        };

        // Register commands for each link option
        Object.entries(imageOptionsContent).forEach(([commandName, data]) => {
            editor.commands.add(commandName, new AlightImagePluginCommand(editor, data));
        });
    }
}
