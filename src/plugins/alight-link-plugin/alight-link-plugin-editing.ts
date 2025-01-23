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
  // Make sure to load the built-in Link plugins
  public static get requires() {
    return [LinkEditing, LinkUI];
  }

  public init() {
    const editor = this.editor;

    // Example link option definitions
    const linkOptionsContent = {
      linkOption1: {
        title: 'Choose a Predefined Link',
        content: '<div class="predefined-link-container"></div>',
        loadContent: async () => getPredefinedLinkContent(1, 10),
      },
      linkOption2: {
        title: 'Public Website Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', false, ''),
      },
      linkOption3: {
        title: 'Intranet Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', true, ''),
      },
      linkOption4: {
        title: 'Existing Document Link',
        content: '<div class="existing-document-link-container"></div>',
        loadContent: async () => getExistingDocumentLinkContent(),
      },
      linkOption5: {
        title: 'New Document Link',
        content: '<div class="new-document-link-container"></div>',
        loadContent: async () => getNewDocumentsLinkContent(),
      }
    };

    // Register commands for each link option
    Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
      editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
    });
  }

  public afterInit() {
    const editor = this.editor;

    // Access the default LinkUI plugin to override the link balloon
    const linkUI = editor.plugins.get(LinkUI);

    // Check for the formView
    const formView = linkUI.formView;
    if (!formView) return;

    const saveButtonView = formView.saveButtonView;
    if (!saveButtonView) return;

    // Change the balloon button label & remove default behavior
    saveButtonView.label = 'Edit with Alight';
    // saveButtonView.off('execute', defaultCallback);

    // Replace with our own function to open the Alight modal
    saveButtonView.once('execute', (evt, data) => {
      // Stop the default 'execute' handlers from triggering
      evt.stop();

      const selection = editor.model.document.selection;

      // The existing link in the selection
      const currentHrefValue = selection.getAttribute('linkHref');
      const hrefString = typeof currentHrefValue === 'string' ? currentHrefValue : '';

      // Suppose we guess "intranet" if it starts with an intranet prefix
      const isIntranet =
        hrefString.startsWith('http://intranet') ||
        hrefString.startsWith('https://intranet');

      const orgName = ''; // If you store it in a separate attribute, retrieve it here

      // Now load the modal content
      getPublicIntranetLinkContent(hrefString, isIntranet, orgName).then(modalContent => {
        const modal = new AlightDialogModal({
          title: isIntranet ? 'Edit Intranet Link' : 'Edit Public Link',
          content: modalContent,
          primaryButton: {
            label: 'Apply',
            onClick: () => {
              const urlInput = document.getElementById('url') as HTMLInputElement | null;
              if (urlInput && urlInput.value) {
                editor.model.change(writer => {
                  // 2-argument usage: set the link on the entire selection
                  writer.setSelectionAttribute('linkHref', urlInput.value);
                });
              }
              modal.closeModal();
            }
          },
          tertiaryButton: {
            label: 'Cancel',
            onClick: () => {
              console.log('Edit canceled');
            }
          },
          onClose: () => {
            console.log('Modal closed');
          }
        });
        modal.show();
      });
      // Now do your custom logic
      console.log('My custom logic!');
    });
  }
}
