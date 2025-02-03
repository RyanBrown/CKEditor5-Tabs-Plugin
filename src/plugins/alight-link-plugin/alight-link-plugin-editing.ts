// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { PredefinedLinkManager } from './modal-content/predefined-link';
import { getPublicIntranetLinkContent } from './modal-content/public-intranet-link';
import { getExistingDocumentLinkContent } from './modal-content/existing-document-link';
import { getNewDocumentsLinkContent } from './modal-content/new-document-link';

export default class AlightLinkPluginEditing extends Plugin {
  // Use definite assignment assertion
  private predefinedLinkManager!: PredefinedLinkManager;

  init() {
    const editor = this.editor;

    // Actually assign it here
    this.predefinedLinkManager = new PredefinedLinkManager();

    // Command 1: Predefined Link
    editor.commands.add(
      'linkOption1',
      new AlightLinkPluginCommand(editor, {
        title: 'Choose a Predefined Link',
        modalType: 'predefinedLink',
        modalOptions: {
          width: '90vw',
        },
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Continue',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleImageSelection()
          }
        ],
        // Use the manager’s method to get the initial HTML string
        loadContent: async () => this.predefinedLinkManager.getPredefinedLinkContent(1),
        // Pass the manager so the command can call manager.renderContent(...)
        manager: this.predefinedLinkManager
      })
    );

    // Command 2: Public Website Link
    editor.commands.add(
      'linkOption2',
      new AlightLinkPluginCommand(editor, {
        title: 'Public Website Link',
        modalType: 'publicWebsiteLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined'
          },
          {
            label: 'Continue',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );

    // Command 3: Intranet Link
    editor.commands.add(
      'linkOption3',
      new AlightLinkPluginCommand(editor, {
        title: 'Intranet Link',
        modalType: 'intranetLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined'
          },
          {
            label: 'Upload',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );

    // Command 4: Existing Document Link
    editor.commands.add(
      'linkOption4',
      new AlightLinkPluginCommand(editor, {
        title: 'Existing Document Link',
        modalType: 'existingDocumentLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined'
          },
          {
            label: 'Upload',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getExistingDocumentLinkContent(1)
      })
    );

    // Command 5: New Document Link
    editor.commands.add(
      'linkOption5',
      new AlightLinkPluginCommand(editor, {
        title: 'New Document Link',
        modalType: 'newDocumentLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button cka-button-rounded cka-button-outlined'
          },
          {
            label: 'Upload',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getNewDocumentsLinkContent()
      })
    );
  }

  private handleCancel(): void {
    // Implementation
    console.log('Cancel clicked');
  }

  private handleImageSelection(): void {
    console.log('Image selection confirmed');
  }

  private handleUpload(): void {
    // Implementation
    console.log('Upload clicked');
  }
}
