// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import AlightLinkPluginCommand, { LinkOptionData } from './alight-link-plugin-command';
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

    // Define link options
    const linkOptionsContent: { [key: string]: LinkOptionData } = {
      linkOption1: {
        title: 'Choose a Predefined Link',
        contentClass: 'predefined-link-container',
        content: '<div class="predefined-link-container">Loading...</div>',
        loadContent: async () => {
          const predefinedContent = await getPredefinedLinkContent(3);
          return `<div class="predefined-link-container">${predefinedContent}</div>`;
        }
      },
      linkOption2: {
        title: 'Public Website Link',
        content: '<div class="public-intranet-link-container">Loading...</div>',
        loadContent: async () => getPublicIntranetLinkContent('', false, '')
      },
      linkOption3: {
        title: 'Intranet Link',
        content: '<div class="public-intranet-link-container">Loading...</div>',
        loadContent: async () => getPublicIntranetLinkContent('', true, '')
      },
      linkOption4: {
        title: 'Existing Document Link',
        content: '<div class="existing-document-link-container">Loading...</div>',
        loadContent: async () => getExistingDocumentLinkContent()
      },
      linkOption5: {
        title: 'New Document Link',
        content: '<div class="new-document-link-container">Loading...</div>',
        loadContent: async () => getNewDocumentsLinkContent()
      }
    };

    // Register commands
    Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
      editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
    });
  }

  public afterInit() {
    const editor = this.editor;

    // Access the default LinkUI plugin to override the link balloon
    const linkUI = editor.plugins.get(LinkUI);
    if (!linkUI) return;

    const formView = linkUI.formView;
    if (!formView) return;

    const saveButtonView = formView.saveButtonView;
    if (!saveButtonView) return;

    // Change the balloon button label
    saveButtonView.label = 'Edit with Alight';

    // Override the default execute handler
    saveButtonView.on('execute', (evt) => {
      evt.stop();

      const selection = editor.model.document.selection;
      const currentHrefValue = selection.getAttribute('linkHref') || '';
      const hrefString = typeof currentHrefValue === 'string' ? currentHrefValue : '';
      const isIntranet = hrefString.startsWith('http://intranet') || hrefString.startsWith('https://intranet');

      // Load modal content asynchronously
      getPublicIntranetLinkContent(hrefString, isIntranet, '')
        .then((modalContent) => {
          import('./../../plugins/alight-dialog-modal/alight-dialog-modal').then(({ AlightDialogModal }) => {
            const modal = new AlightDialogModal({
              title: isIntranet ? 'Edit Intranet Link' : 'Edit Public Link',
              content: 'Loading...', // Initial placeholder
              primaryButton: {
                label: 'Apply',
                onClick: () => {
                  const urlInput = document.getElementById('url') as HTMLInputElement;
                  if (urlInput?.value) {
                    editor.model.change((writer) => {
                      writer.setSelectionAttribute('linkHref', urlInput.value);
                    });
                  }
                  modal.closeModal(); // Correct: no arguments
                }
              },
              tertiaryButton: { label: 'Cancel', onClick: () => console.log('Edit canceled') },
              onClose: () => { console.log('Modal closed'); }
            });
            modal.show();

            // Update modal content after loading
            modal.updateContent(modalContent);
          });
        })
        .catch((error) => {
          console.error('Error loading link modal content:', error);
          // Optionally, update the modal with an error message
          import('./../../plugins/alight-dialog-modal/alight-dialog-modal').then(({ AlightDialogModal }) => {
            const modal = new AlightDialogModal({
              title: isIntranet ? 'Edit Intranet Link' : 'Edit Public Link',
              content: '<p>Error loading content. Please try again later.</p>',
              primaryButton: {
                label: 'Close',
                onClick: () => {
                  modal.closeModal(); // Correct: no arguments
                }
              },
              tertiaryButton: { label: 'Cancel', onClick: () => console.log('Edit canceled') },
              onClose: () => { console.log('Modal closed'); }
            });
            modal.show();
          });
        });
    });
  }
}
