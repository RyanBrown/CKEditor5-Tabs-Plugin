// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { ExistingDocumentLinkManager } from './modal-content/existing-document-link';
import { NewDocumentLinkManager } from './modal-content/new-document-link';
import { PublicIntranetLinkManager } from './modal-content/public-intranet-link';
import { PredefinedLinkManager } from './modal-content/predefined-link';
import { CommandData, DialogButton } from './modal-content/types';

export default class AlightLinkPluginEditing extends Plugin {
  // Use definite assignment assertion for all managers
  private predefinedLinkManager!: PredefinedLinkManager;
  private existingDocumentLinkManager!: ExistingDocumentLinkManager;
  private newDocumentLinkManager!: NewDocumentLinkManager;
  private publicWebsiteLinkManager!: PublicIntranetLinkManager;
  private intranetLinkManager!: PublicIntranetLinkManager;

  private readonly defaultButtons = {
    cancel: {
      label: 'Cancel',
      variant: 'outlined' as const,
      className: 'cka-button cka-button-rounded cka-button-outlined cka-button-sm',
      closeOnClick: true
    },
    continue: {
      label: 'Continue',
      variant: 'default' as const,
      className: 'cka-button cka-button-rounded cka-button-sm',
      closeOnClick: true
    },
    create: {
      label: 'Create Document',
      variant: 'default' as const,
      className: 'cka-button cka-button-rounded',
      closeOnClick: true
    }
  };

  private getStandardButtons(onContinue: () => void): DialogButton[] {
    return [
      this.defaultButtons.cancel,
      {
        ...this.defaultButtons.continue,
        onClick: onContinue
      }
    ];
  }

  public static get pluginName() {
    return 'AlightLinkPluginEditing';
  }

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
    const predefinedLinkCommand: CommandData = {
      title: 'Choose a Predefined Link',
      modalType: 'predefinedLink',
      modalOptions: {
        width: '90vw',
        contentClass: 'cka-predefined-link-content'
      },
      buttons: this.getStandardButtons(() => this.handlePredefinedLinkSelection()),
      loadContent: async () => this.predefinedLinkManager.getLinkContent(1),
      manager: this.predefinedLinkManager
    };

    editor.commands.add('linkOption1', new AlightLinkPluginCommand(editor, predefinedLinkCommand));

    // Command 2: Public Website Link
    editor.commands.add(
      'linkOption2',
      new AlightLinkPluginCommand(editor, {
        title: 'Public Website Link',
        modalType: 'publicWebsiteLink',
        buttons: this.getStandardButtons(() => this.handlePublicWebsiteLinkSelection()),
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
        buttons: this.getStandardButtons(() => this.handleIntranetLinkSelection()),
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
          width: '90vw',
          contentClass: 'cka-existing-document-content'
        },
        buttons: this.getStandardButtons(() => this.handleExistingDocumentSelection()),
        loadContent: async () => this.existingDocumentLinkManager.getLinkContent(1),
        manager: this.existingDocumentLinkManager
      })
    );

    // Command 5: New Document Link (special case with create button)
    editor.commands.add(
      'linkOption5',
      new AlightLinkPluginCommand(editor, {
        title: 'New Document Link',
        modalType: 'newDocumentLink',
        buttons: [
          this.defaultButtons.cancel,
          {
            ...this.defaultButtons.create,
            onClick: () => {
              if (this.newDocumentLinkManager.submitForm()) {
                const formData = this.newDocumentLinkManager.getFormData();
                console.log('Document created:', formData);
                this.handleNewDocumentUpload();
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
      allowAttributes: ['linkHref', 'linkTarget']
    });
  }

  private setupConverters(): void {
    const conversion = this.editor.conversion;

    // Model to view conversion for data pipeline (saving/loading)
    conversion.for('dataDowncast').attributeToElement({
      model: {
        key: 'linkHref',
        name: 'a'
      },
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', {
          class: 'ck-link',
          href,
          target: '_blank'
        }, {
          priority: 5
        });
      }
    });

    // Model to view conversion for editing pipeline (editing in editor)
    conversion.for('editingDowncast').attributeToElement({
      model: {
        key: 'linkHref',
        name: 'a'
      },
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', {
          class: 'ck-link',
          href,
          target: '_blank'
        }, {
          priority: 5
        });
      }
    });

    // View to model conversion
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: true
        }
      },
      model: {
        key: 'linkHref',
        value: (viewElement: any) => viewElement.getAttribute('href')
      }
    });
  }

  private handlePredefinedLinkSelection(): void {
    console.log('Predefined Link confirmed');
  }

  private handlePublicWebsiteLinkSelection(): void {
    console.log('Public Website Link confirmed');
  }

  private handleIntranetLinkSelection(): void {
    console.log('Intranet Link confirmed');
  }

  private handleExistingDocumentSelection(): void {
    console.log('Existing Document Link confirmed');
  }

  private handleNewDocumentUpload(): void {
    console.log('Upload clicked');
  }
}