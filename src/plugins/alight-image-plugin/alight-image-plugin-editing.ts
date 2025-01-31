// src/plugins/alight-image-plugin/alight-image-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightImagePluginCommand } from './alight-image-plugin-command';
// import { getExistingImageContent } from './modal-content/existing-image';
import { getUploadImageContent } from './modal-content/upload-image';
import { getPredefinedLinkContent } from './modal-content/predefined-link'

export default class AlightImagePluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    // Two separate commands for two types of content
    editor.commands.add(
      'imageOption1',
      new AlightImagePluginCommand(editor, {
        title: 'Existing Image',
        primaryButtonLabel: 'Choose',
        // loadContent: async () => getExistingImageContent()
        loadContent: async () => getPredefinedLinkContent(1)
      })
    );

    editor.commands.add(
      'imageOption2',
      new AlightImagePluginCommand(editor, {
        title: 'Upload Image',
        primaryButtonLabel: 'Upload',
        loadContent: async () => getUploadImageContent()
      })
    );
  }
}
