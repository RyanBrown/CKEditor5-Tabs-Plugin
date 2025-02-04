// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { ExistingDocumentLinkManager } from './modal-content/existing-document-link';
import { NewDocumentLinkManager } from './modal-content/new-document-link';
import { PublicIntranetLinkManager } from './modal-content/public-intranet-link';
import { PredefinedLinkManager } from './modal-content/predefined-link';

export default class AlightLinkPluginEditing extends Plugin {
  // Use definite assignment assertion for all managers
  private predefinedLinkManager!: PredefinedLinkManager;
  private existingDocumentLinkManager!: ExistingDocumentLinkManager;
  private newDocumentLinkManager!: NewDocumentLinkManager;
  private publicWebsiteLinkManager!: PublicIntranetLinkManager;
  private intranetLinkManager!: PublicIntranetLinkManager;

  init() {
    const editor = this.editor;

    // Set up link schema and conversion
    this.setupSchema();
    this.setupConverters();

    // Create all managers
    this.predefinedLinkManager = new PredefinedLinkManager();
    this.existingDocumentLinkManager = new ExistingDocumentLinkManager();
    this.newDocumentLinkManager = new NewDocumentLinkManager();
    this.publicWebsiteLinkManager = new PublicIntranetLinkManager('', false);
    this.intranetLinkManager = new PublicIntranetLinkManager('', true);

    // Command 1: Predefined Link
    editor.commands.add(
      'linkOption1',
      new AlightLinkPluginCommand(editor, {
        title: 'Choose a Predefined Link',
        modalType: 'predefinedLink',
        modalOptions: {
          width: '90vw'
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
        loadContent: async () => this.predefinedLinkManager.getLinkContent(1),
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
            className: 'cka-button cka-button-rounded cka-button-outlined',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Continue',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => this.publicWebsiteLinkManager.getLinkContent(1),
        manager: this.publicWebsiteLinkManager
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
            className: 'cka-button cka-button-rounded cka-button-outlined',
            onClick: () => this.handleCancel()
          },
          {
            label: 'Continue',
            className: 'cka-button cka-button-rounded',
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => this.intranetLinkManager.getLinkContent(1),
        manager: this.intranetLinkManager
      })
    );

    // Command 4: Existing Document Link
    editor.commands.add(
      'linkOption4',
      new AlightLinkPluginCommand(editor, {
        title: 'Existing Document Link',
        modalType: 'existingDocumentLink',
        modalOptions: {
          width: '90vw'
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
            onClick: () => this.handleUpload()
          }
        ],
        loadContent: async () => this.existingDocumentLinkManager.getLinkContent(1),
        manager: this.existingDocumentLinkManager
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
            className: 'cka-button cka-button-rounded cka-button-outlined',
            onClick: () => {
              this.newDocumentLinkManager.resetSearch();
              this.handleCancel();
            }
          },
          {
            label: 'Create Document',
            className: 'cka-button cka-button-rounded',
            onClick: () => {
              if (this.newDocumentLinkManager.submitForm()) {
                const formData = this.newDocumentLinkManager.getFormData();
                // Here you would typically do something with the form data
                console.log('Document created:', formData);
                this.handleUpload();
              }
            }
          }
        ],
        loadContent: async () => this.newDocumentLinkManager.getLinkContent(1),
        manager: this.newDocumentLinkManager
      })
    );
  }

  private setupSchema(): void {
    const schema = this.editor.model.schema;

    // Allow links on text
    schema.extend('$text', {
      allowAttributes: ['link', 'linkTarget']
    });

    // Register the link element in the schema
    schema.register('link', {
      allowWhere: '$text',
      allowContentOf: '$text',
      allowAttributes: ['href', 'target']
    });
  }

  private setupConverters(): void {
    const conversion = this.editor.conversion;

    // Model to view conversion for data pipeline
    conversion.for('dataDowncast').elementToElement({
      model: 'link',
      view: (modelElement, { writer }) => {
        const href = modelElement.getAttribute('href');
        const target = modelElement.getAttribute('target');

        return writer.createContainerElement('a', {
          href,
          target: target || '_blank'
        });
      }
    });

    // Model to view conversion for editing pipeline
    conversion.for('editingDowncast').elementToElement({
      model: 'link',
      view: (modelElement, { writer }) => {
        const href = modelElement.getAttribute('href');
        const target = modelElement.getAttribute('target');

        const linkElement = writer.createContainerElement('a', {
          href,
          target: target || '_blank',
          class: 'ck-link'
        });

        return linkElement;
      }
    });

    // View to model conversion
    conversion.for('upcast').elementToElement({
      view: {
        name: 'a',
        attributes: {
          href: true
        }
      },
      model: (viewElement, { writer }) => {
        const href = viewElement.getAttribute('href');
        const target = viewElement.getAttribute('target');

        return writer.createElement('link', {
          href,
          target: target || '_blank'
        });
      }
    });
  }

  private handleCancel(): void {
    console.log('Cancel clicked');
  }

  private handleImageSelection(): void {
    console.log('Image selection confirmed');
  }

  private handleUpload(): void {
    console.log('Upload clicked');
  }
}