// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { getPredefinedLinkContent } from './modal-content/predefined-link';
import { getPublicIntranetLinkContent } from './modal-content/public-intranet-link';
import { getExistingDocumentLinkContent } from './modal-content/existing-document-link';
import { getNewDocumentsLinkContent } from './modal-content/new-document-link';

export default class AlightLinkPluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    // Two separate commands for two types of content
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
            className: 'ck-button-secondary',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Choose',
            className: 'ck-button-primary',
            onClick: () => this.handleImageSelection()
          }
        ],
        loadContent: async () => getPredefinedLinkContent(1) // set start pagination page
      })
    );
    editor.commands.add(
      'linkOption2',
      new AlightLinkPluginCommand(editor, {
        title: 'Public Website Link',
        modalType: 'publicWebsiteLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'ck-button-secondary'
          },
          {
            label: 'Continue',
            className: 'ck-button-primary',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );
    editor.commands.add(
      'linkOption3',
      new AlightLinkPluginCommand(editor, {
        title: 'Intranet Link',
        modalType: 'intranetLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'ck-button-secondary'
          },
          {
            label: 'Upload',
            className: 'ck-button-primary',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );
    editor.commands.add(
      'linkOption4',
      new AlightLinkPluginCommand(editor, {
        title: 'Existing Document Link',
        modalType: 'existingDocumentLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'ck-button-secondary'
          },
          {
            label: 'Upload',
            className: 'ck-button-primary',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => getExistingDocumentLinkContent(1)
      })
    );
    editor.commands.add(
      'linkOption5',
      new AlightLinkPluginCommand(editor, {
        title: 'New Document Link',
        modalType: 'newDocumentLink',
        buttons: [
          {
            label: 'Cancel',
            className: 'ck-button-secondary'
          },
          {
            label: 'Upload',
            className: 'ck-button-primary',
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
    // Implementation
    console.log('Image selection confirmed');
  }

  private handleUpload(): void {
    // Implementation
    console.log('Upload clicked');
  }
}