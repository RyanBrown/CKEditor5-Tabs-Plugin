// src/plugins/alight-population-plugin/alight-population-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightPopulationPluginCommand } from './alight-population-plugin-command';
import { getSystemPopulationsContent } from './modal-content/system-populations';

export default class AlightPopulationPluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    editor.commands.add(
      'systemPopulations',
      new AlightPopulationPluginCommand(editor, {
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
            className: 'ck-button-secondary',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Upload',
            className: 'ck-button-primary',
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