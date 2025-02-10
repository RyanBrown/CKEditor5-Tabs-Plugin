// src/plugins/alight-modal-link-plugin/alight-modal-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightModalLinkPluginCommand } from './alight-modal-link-plugin-command';
import { getSystemPopulationsContent } from './modal-content/system-populations';

export default class AlightModalLinkPluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    editor.commands.add(
      'systemPopulations',
      new AlightModalLinkPluginCommand(editor, {
        title: 'System Populations',
        modalType: 'systemPopulations',
        modalOptions: {
          width: '600px',
          draggable: true,
          resizable: true,
        },
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined cka-button-sm',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Upload',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getSystemPopulationsContent()
      })
    );
  }

  private handleCancel(): void {
    // Implementation
    console.log('Cancel clicked');
  }

  private handleUpload(): void {
    // Implementation for handling population
    console.log('Population clicked');
  }
}