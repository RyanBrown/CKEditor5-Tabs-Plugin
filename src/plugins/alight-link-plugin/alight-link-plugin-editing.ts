// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { ExistingDocumentLinkManager } from './modal-content/existing-document-link';
import { NewDocumentLinkManager } from './modal-content/new-document-link';
import { PublicIntranetLinkManager } from './modal-content/public-intranet-link';
import { PredefinedLinkManager } from './modal-content/predefined-link';
import { CommandData, DialogButton } from './modal-content/types';
import type { Editor } from '@ckeditor/ckeditor5-core';

/**
 * A CKEditor plugin that extends the editor with enhanced link functionality.
 * This plugin provides various types of link options including predefined links,
 * document links, and intranet links, each with their own UI and behavior.
 */
export default class AlightLinkPluginEditing extends Plugin {
  private predefinedLinkManager: PredefinedLinkManager;
  private existingDocumentLinkManager: ExistingDocumentLinkManager;
  private newDocumentLinkManager: NewDocumentLinkManager;
  private publicWebsiteLinkManager: PublicIntranetLinkManager;
  private intranetLinkManager: PublicIntranetLinkManager;
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

  constructor(editor: Editor) {
    super(editor);

    // Initialize managers
    this.predefinedLinkManager = new PredefinedLinkManager();
    this.existingDocumentLinkManager = new ExistingDocumentLinkManager();
    this.newDocumentLinkManager = new NewDocumentLinkManager();
    this.publicWebsiteLinkManager = new PublicIntranetLinkManager('', false);
    this.intranetLinkManager = new PublicIntranetLinkManager('', true);
  }

  init() {
    const editor = this.editor;

    // Initialize managers
    this.predefinedLinkManager = new PredefinedLinkManager();
    this.existingDocumentLinkManager = new ExistingDocumentLinkManager();
    this.newDocumentLinkManager = new NewDocumentLinkManager();
    this.publicWebsiteLinkManager = new PublicIntranetLinkManager('', false);
    this.intranetLinkManager = new PublicIntranetLinkManager('', true);

    // Setup schema and converters
    this.setupSchema();
    this.setupConverters();
    this.setupCommands(editor);

    // Listen for balloon panel show events
    this.editor.ui.on('balloonPanel:show', (evt, data) => {
      // Get the balloon panel DOM element and the currently selected link
      const balloonPanel = data.view.element;
      const selectedLink = this.editor.editing.view.document.selection.getFirstPosition()?.parent;

      if (selectedLink instanceof Element && balloonPanel) {
        // Add the appropriate link type class to the balloon panel
        const linkType = selectedLink.getAttribute('data-link-type') || '';
        const className = this.getLinkClass(linkType);
        balloonPanel.classList.add(className);

        // Debug: Log all elements with IDs in the balloon panel
        console.log('=== Balloon Panel Structure ===');
        const elementsWithIds = balloonPanel.querySelectorAll('[id]');
        console.log(`Found ${elementsWithIds.length} elements with IDs:`);

        // Iterate through each element and log its details
        elementsWithIds.forEach((element: Element, index: number) => {
          console.log(`${index + 1}. Element Details:`);
          console.log(`   - ID: ${element.id}`);
          console.log(`   - Tag: ${element.tagName.toLowerCase()}`);
          console.log(`   - Classes: ${element.className}`);
          console.log(`   - Text Content: ${element.textContent?.trim()}`);
        });

        console.log('=== End Balloon Panel Structure ===');
      }
    });
  }

  private setupSchema(): void {
    const schema = this.editor.model.schema;
    schema.extend('$text', {
      allowAttributes: ['linkHref', 'linkTarget', 'linkType']
    });
  }

  private setupConverters(): void {
    const conversion = this.editor.conversion;

    // Model to view conversion for data pipeline
    conversion.for('dataDowncast').attributeToElement({
      model: {
        key: 'linkHref',
        values: ['linkType']
      },
      view: (href, conversionApi) => {
        const { writer, consumable } = conversionApi;
        const linkType = consumable.consume(this.editor.model.document.selection, 'linkType');

        return writer.createAttributeElement('a', {
          class: `ck-link ${linkType || ''}`,
          href,
          target: '_blank'
        }, {
          priority: 5
        });
      }
    });

    // Model to view conversion for editing pipeline
    conversion.for('editingDowncast').attributeToElement({
      model: {
        key: 'linkHref'
      },
      view: (href, { writer, mapper, consumable }) => {
        const linkType = this.editor.model.document.selection.getAttribute('linkType');
        const className = this.getLinkClass(linkType as string);

        return writer.createAttributeElement('a', {
          class: `ck-link ${className}`, // Add the class directly to link
          href,
          target: '_blank',
          'data-link-type': linkType // Store link type as data attribute
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

  private getLinkClass(linkType: string): string {
    switch (linkType) {
      case 'predefined':
        return 'predefined-link-balloon';
      case 'existing-document':
        return 'existing-document-link-balloon';
      case 'new-document':
        return 'new-document-link-balloon';
      case 'public-website':
        return 'public-website-link-balloon';
      case 'intranet':
        return 'intranet-link-balloon';
      default:
        return '';
    }
  }

  private setupCommands(editor: Editor): void {
    // Command 1: Predefined Link
    editor.commands.add('linkOption1', new AlightLinkPluginCommand(editor, {
      title: 'Choose a Predefined Link',
      modalType: 'predefinedLink',
      modalOptions: {
        width: '90vw',
        contentClass: 'cka-predefined-link-content'
      },
      buttons: this.getStandardButtons(() => this.handlePredefinedLinkSelection()),
      loadContent: async () => this.predefinedLinkManager.getLinkContent(1),
      manager: this.predefinedLinkManager,
      linkType: 'predefined'
    }));

    // Command 2: Public Website Link
    editor.commands.add('linkOption2', new AlightLinkPluginCommand(editor, {
      title: 'Public Website Link',
      modalType: 'publicWebsiteLink',
      buttons: this.getStandardButtons(() => this.handleNewDocumentUpload()),
      loadContent: async () => this.publicWebsiteLinkManager.getLinkContent(1),
      manager: this.publicWebsiteLinkManager,
      linkType: 'public-website'
    }));

    // Command 3: Intranet Link
    editor.commands.add(
      'linkOption3',
      new AlightLinkPluginCommand(editor, {
        title: 'Intranet Link',
        modalType: 'intranetLink',
        buttons: this.getStandardButtons(() => this.handleIntranetLinkSelection()),
        loadContent: async () => this.intranetLinkManager.getLinkContent(1),
        manager: this.intranetLinkManager,
        linkType: 'intranet'
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
        manager: this.existingDocumentLinkManager,
        linkType: 'existing-document'
      })
    );

    // Command 5: New Document Link
    editor.commands.add('linkOption5', new AlightLinkPluginCommand(editor, {
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
      manager: this.newDocumentLinkManager,
      linkType: 'new-document'
    }));
  }

  private getStandardButtons(onContinue: () => void): DialogButton[] {
    return [
      {
        label: 'Cancel',
        variant: 'outlined' as const,
        className: 'cka-button cka-button-rounded cka-button-outlined cka-button-sm',
        closeOnClick: true
      },
      {
        label: 'Continue',
        variant: 'default' as const,
        className: 'cka-button cka-button-rounded cka-button-sm',
        closeOnClick: true,
        onClick: onContinue
      }
    ];
  }

  private handlePredefinedLinkSelection(): void {
    // Implementation
  }

  private handleIntranetLinkSelection(): void {
    console.log('Intranet Link confirmed');
  }

  private handleExistingDocumentSelection(): void {
    console.log('Existing Document Link confirmed');
  }

  private handleNewDocumentUpload(): void {
    console.log('New Document Upload clicked');
  }
}