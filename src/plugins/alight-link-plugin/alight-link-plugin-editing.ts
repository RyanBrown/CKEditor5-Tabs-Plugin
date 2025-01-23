// alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import AlightLinkPluginCommand from './alight-link-plugin-command';
import { AlightDialogModal } from '../alight-dialog-modal/alight-dialog-modal';
import { getPredefinedLinkContent } from './modal-content/predefined-link';
import { getPublicIntranetLinkContent } from './modal-content/public-intranet-link';
import { getExistingDocumentLinkContent } from './modal-content/existing-document-link';
import { getNewDocumentsLinkContent } from './modal-content/new-document-link';

export default class AlightLinkPluginEditing extends Plugin {
  public static get requires() {
    return [LinkEditing, LinkUI];
  }

  public init() {
    const editor = this.editor;

    const linkOptionsContent = {
      linkOptionPublic: {
        title: 'Public Website Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', false, ''),
      },
      linkOptionIntranet: {
        title: 'Intranet Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', true, ''),
      },
      predefinedLinkOption: {
        title: 'Choose a Predefined Link',
        content: '<div class="predefined-link-container"></div>',
        loadContent: async () => getPredefinedLinkContent(1, 10),
      },
      existingDocLinkOption: {
        title: 'Existing Document Link',
        content: '<div class="existing-document-link-container"></div>',
        loadContent: async () => getExistingDocumentLinkContent(),
      },
      newDocLinkOption: {
        title: 'New Document Link',
        content: '<div class="new-document-link-container"></div>',
        loadContent: async () => getNewDocumentsLinkContent(),
      },
    };

    // Register commands
    Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
      editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
    });
  }

  public afterInit() {
    const editor = this.editor;
    const linkUI = editor.plugins.get(LinkUI);

    // Check for the formView
    const formView = linkUI.formView;
    if (!formView) {
      return;
    }

    const saveButtonView = formView.saveButtonView;
    if (!saveButtonView) {
      return;
    }

    // Override the label and event
    saveButtonView.label = 'Edit with Alight';
    saveButtonView.off('execute');

    // Provide our custom balloon override
    saveButtonView.on('execute', () => {
      const selection = editor.model.document.selection;
      const currentHref = selection.getAttribute('linkHref');
      const hrefString = typeof currentHref === 'string' ? currentHref : '';

      // Decide if it's intranet
      const isIntranet =
        hrefString.startsWith('http://intranet') ||
        hrefString.startsWith('https://intranet');

      const orgName = ''; // If you store it in a separate attribute, retrieve it here

      getPublicIntranetLinkContent(hrefString, isIntranet, orgName).then(modalContent => {
        const modal = new AlightDialogModal({
          title: isIntranet ? 'Edit Intranet Link' : 'Edit Public Link',
          content: modalContent,
          primaryButton: {
            label: 'Apply',
            onClick: () => {
              const urlInput = document.getElementById('url') as HTMLInputElement | null;
              if (urlInput && urlInput.value) {
                // Use two arguments
                editor.model.change(writer => {
                  writer.setSelectionAttribute('linkHref', urlInput.value);
                });
              }

              const orgInput = document.getElementById('org-name') as HTMLInputElement | null;
              if (orgInput) {
                console.log('Updated org name:', orgInput.value);
              }

              modal.closeModal();
            },
          },
          tertiaryButton: {
            label: 'Cancel',
            onClick: () => {
              console.log('Modal dismissed');
            },
          },
          onClose: () => {
            console.log('Modal closed');
          },
        });
        modal.show();
      });
    });
  }
}
