// src/plugins/alight-image-plugin/alight-image-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightImagePluginCommand } from './alight-image-plugin-command';
import { getExistingImageContent } from './modal-content/existing-image';
import { getUploadImageContent } from './modal-content/upload-image';

export default class AlightImagePluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    // Two separate commands for two types of content
    editor.commands.add(
      'imageOption1',
      new AlightImagePluginCommand(editor, {
        title: 'Existing Image',
        modalType: 'existingImage',
        modalOptions: {
          width: '80vw',
        },
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined cka-button-sm',
            onClick: () => this.handleCancel(),
          },
          {
            label: 'Continue',
            className: 'cka-button cka-button-rounded cka-button-sm',
            onClick: () => this.handleImageSelection(),
          },
        ],
        loadContent: async () => getExistingImageContent(),
      })
    );

    editor.commands.add(
      'imageOption2',
      new AlightImagePluginCommand(editor, {
        title: 'Upload Image',
        modalType: 'uploadImage',
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined cka-button-sm',
          },
          {
            label: 'Upload',
            className: 'cka-button cka-button-rounded cka-button-sm',
            onClick: () => this.handleUpload(),
          },
        ],
        loadContent: async () => getUploadImageContent(),
      })
    );
  }

  private handleCancel(): void {
    // Implementation
    console.log('Cancel clicked');
  }

  private handleImageSelection(): void {
    // Implementation
    console.log('Image selection confirmed');
  }

  private handleUpload(): void {
    // Implementation
    console.log('Upload clicked');
  }
}
