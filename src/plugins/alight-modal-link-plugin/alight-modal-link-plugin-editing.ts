// src/plugins/alight-modal-link-plugin/alight-modal-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightModalLinkPluginCommand } from './alight-modal-link-plugin-command';
import { ExistingDocumentLinkManager } from './modal-content/existing-document-link';
import { NewDocumentLinkManager } from './modal-content/new-document-link';
import { PublicIntranetLinkManager } from './modal-content/public-intranet-link';
import { PredefinedLinkManager } from './modal-content/predefined-link';
import type { Editor } from '@ckeditor/ckeditor5-core';

// A CKEditor plugin that extends the editor with enhanced link functionality.
// This plugin provides various types of link options including predefined links,
// document links, and intranet links, each with their own UI and behavior.

export default class AlightModalLinkPluginEditing extends Plugin {
  // Link managers for different types of links
  private predefinedLinkManager: PredefinedLinkManager;
  private existingDocumentLinkManager: ExistingDocumentLinkManager;
  private newDocumentLinkManager: NewDocumentLinkManager;
  private publicWebsiteLinkManager: PublicIntranetLinkManager;
  private intranetLinkManager: PublicIntranetLinkManager;

  // Default button configurations used across different link dialogs
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

  // Initialize the plugin with necessary link managers
  // @param editor - The CKEditor instance
  constructor(editor: Editor) {
    super(editor);

    // Initialize all link managers
    this.predefinedLinkManager = new PredefinedLinkManager(editor);
    this.existingDocumentLinkManager = new ExistingDocumentLinkManager(editor);
    this.newDocumentLinkManager = new NewDocumentLinkManager(editor);
    this.publicWebsiteLinkManager = new PublicIntranetLinkManager(editor, '', false);
    this.intranetLinkManager = new PublicIntranetLinkManager(editor, '', true);
  }

  // Initialize the plugin by setting up schema, converters, commands,
  // and event listeners for the balloon panel
  public init(): void {
    const editor = this.editor;

    this.setupSchema();
    this.setupConverters();
    this.setupCommands(editor);

    editor.model.document.selection.on('change:range', () => {
      const selection = editor.model.document.selection;
      if (selection.hasAttribute('linkHref')) {
        const linkType = selection.getAttribute('linkType');
        switch (linkType) {
          case 'predefined':
            this.predefinedLinkManager.showBalloon(selection);
            break;
          case 'existing-document':
            this.existingDocumentLinkManager.showBalloon(selection);
            break;
          case 'new-document':
            this.newDocumentLinkManager.showBalloon(selection);
            break;
          case 'public-website':
            this.publicWebsiteLinkManager.showBalloon(selection);
            break;
          case 'intranet':
            this.intranetLinkManager.showBalloon(selection);
            break;
        }
      }

      // Add event listener to modify balloon panel classes dynamically
      this.editor.ui.on('balloonPanel:show', (evt, data) => {
        // Get the balloon panel DOM element
        const balloonPanel = data.view.element;
        const selectedLink = this.editor.editing.view.document.selection.getFirstPosition()?.parent;

        if (selectedLink instanceof Element && balloonPanel) {
          // Get the link type from data attribute
          const linkType = selectedLink.getAttribute('data-link-type') || '';

          // Remove previous link type classes
          balloonPanel.classList.remove(
            'predefined-link-balloon',
            'existing-document-link-balloon',
            'new-document-link-balloon',
            'public-website-link-balloon',
            'intranet-link-balloon'
          );

          // Add the new class based on link type
          const className = this.getLinkClass(linkType);
          if (className) {
            balloonPanel.classList.add(className);
          }

          console.log(`Applied class "${className}" to balloon panel.`);
        }
      });
    });
  }

  // Set up the editor's schema to allow link-related attributes on text nodes
  private setupSchema(): void {
    const schema = this.editor.model.schema;
    schema.extend('$text', {
      allowAttributes: ['linkHref', 'linkTarget', 'linkType']
    });
  }

  // Configure data conversion between the model and view
  // Handles both editing and data pipelines
  private setupConverters(): void {
    const conversion = this.editor.conversion;

    // Data Downcast: Convert model attributes to view elements
    conversion.for('dataDowncast').attributeToElement({
      model: 'linkHref',
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', {
          href,
          target: '_blank',
          class: 'ck-link ck-link_selected',
          'data-link-type': this.editor.model.document.selection.getAttribute('linkType') || ''
        }, { priority: 5 });
      }
    });

    // Editing Downcast: Convert model attributes to editable view elements
    conversion.for('editingDowncast').attributeToElement({
      model: 'linkHref',
      view: (href, { writer }) => {
        return writer.createAttributeElement('a', {
          href,
          target: '_blank',
          class: 'ck-link ck-link_selected',
          'data-link-type': this.editor.model.document.selection.getAttribute('linkType') || ''
        }, { priority: 5 });
      }
    });

    // Upcast: Convert view elements to model attributes
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: true,
          'data-link-type': true // Capture link type for UI updates
        }
      },
      model: {
        key: 'linkHref',
        value: (viewElement: any) => viewElement.getAttribute('href')
      }
    });
  }
  // Get the appropriate CSS class for a given link type
  // @param linkType - The type of link (predefined, existing-document, etc.)
  // @returns The corresponding CSS class name
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

  private getStandardButtons(onContinue: () => void) {
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

  // Set up all link-related commands in the editor
  // Each command corresponds to a different type of link
  // @param editor - The CKEditor instance
  private setupCommands(editor: Editor): void {
    // Command for predefined links
    editor.commands.add('linkOption1', new AlightModalLinkPluginCommand(editor, {
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

    // Command for public website links
    editor.commands.add('linkOption2', new AlightModalLinkPluginCommand(editor, {
      title: 'Public Website Link',
      modalType: 'publicWebsiteLink',
      buttons: this.getStandardButtons(() => this.handleNewDocumentUpload()),
      loadContent: async () => this.publicWebsiteLinkManager.getLinkContent(1),
      manager: this.publicWebsiteLinkManager,
      linkType: 'public-website'
    }));

    // Command for intranet links
    editor.commands.add('linkOption3', new AlightModalLinkPluginCommand(editor, {
      title: 'Intranet Link',
      modalType: 'intranetLink',
      buttons: this.getStandardButtons(() => this.handleIntranetLinkSelection()),
      loadContent: async () => this.intranetLinkManager.getLinkContent(1),
      manager: this.intranetLinkManager,
      linkType: 'intranet'
    }));

    // Command for existing document links
    editor.commands.add('linkOption4', new AlightModalLinkPluginCommand(editor, {
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
    }));

    // Command for new document links
    editor.commands.add('linkOption5', new AlightModalLinkPluginCommand(editor, {
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

  // Handle selection of a predefined link
  private handlePredefinedLinkSelection(): void {
    console.log('Predefined Link confirmed');
  }

  // Handle selection of an intranet link
  private handleIntranetLinkSelection(): void {
    console.log('Intranet Link confirmed');
  }

  // Handle selection of an existing document
  private handleExistingDocumentSelection(): void {
    console.log('Existing Document Link confirmed');
  }

  // Handle upload of a new document
  private handleNewDocumentUpload(): void {
    console.log('New Document Upload clicked');
  }
}