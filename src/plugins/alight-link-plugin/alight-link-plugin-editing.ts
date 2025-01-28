// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import AlightLinkPluginCommand from './alight-link-plugin-command';
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

    // Example link option definitions
    const linkOptionsContent = {
      linkOption1: {
        title: 'Choose a Predefined Link',
        contentClass: 'predefined-link-container', // Define the class to be applied
        content: '<div class="predefined-link-container"></div>', // Placeholder content with the correct class
        loadContent: async () => {
          // Load the actual content and wrap it in the container class dynamically
          const predefinedContent = await getPredefinedLinkContent(3);
          return `<div class="predefined-link-container">${predefinedContent}</div>`;
        }
      },
      linkOption2: {
        title: 'Public Website Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', false, '')
      },
      linkOption3: {
        title: 'Intranet Link',
        content: '<div class="public-intranet-link-container"></div>',
        loadContent: async () => getPublicIntranetLinkContent('', true, '')
      },
      linkOption4: {
        title: 'Existing Document Link',
        content: '<div class="existing-document-link-container"></div>',
        loadContent: async () => getExistingDocumentLinkContent()
      },
      linkOption5: {
        title: 'New Document Link',
        content: '<div class="new-document-link-container"></div>',
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

    // Intercept the default callback once, open your custom modal instead
    saveButtonView.once('execute', (evt) => {
      evt.stop();

      const selection = editor.model.document.selection;
      const currentHrefValue = selection.getAttribute('linkHref') || '';
      const hrefString = typeof currentHrefValue === 'string' ? currentHrefValue : '';
      const isIntranet = hrefString.startsWith('http://intranet') || hrefString.startsWith('https://intranet');

      // Example: load content from an existing function (already statically imported)
      getPublicIntranetLinkContent(hrefString, isIntranet, '').then((modalContent) => {
        // If we want to open a manual modal:
        import('./../../plugins/alight-dialog-modal/alight-dialog-modal').then(({ AlightDialogModal }) => {
          const modal = new AlightDialogModal({
            title: isIntranet ? 'Edit Intranet Link' : 'Edit Public Link',
            content: modalContent,
            primaryButton: {
              label: 'Apply',
              onClick: () => {
                const urlInput = document.getElementById('url') as HTMLInputElement;
                if (urlInput?.value) {
                  editor.model.change((writer) => {
                    writer.setSelectionAttribute('linkHref', urlInput.value);
                  });
                }
                modal.closeModal();
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
