// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginEditing } from './alight-custom-modal-link-plugin-editing';
import { AlightCustomModalLinkPluginUI } from './alight-custom-modal-link-plugin-ui';
import { hasLinkAttribute } from './alight-custom-modal-link-plugin-utils';
import CKAlightModalDialog, {
  DialogOptions,
  DialogButton
} from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { DocumentSelection } from '@ckeditor/ckeditor5-engine';

/**
 * The main plugin that ties together:
 *  - Our editing plugin (schema, conversion, commands)
 *  - Our UI plugin (balloon form, toolbar button)
 *  - The custom modal for inserting the link
 */
export default class AlightCustomModalLinkPlugin extends Plugin {
  // We do not rely on the default CKEditor link plugin at all.
  public static get requires() {
    return [AlightCustomModalLinkPluginEditing, AlightCustomModalLinkPluginUI];
  }

  // The plugin name used for registration and retrieval.
  public static get pluginName() {
    return 'AlightCustomModalLinkPlugin';
  }

  // Initializes the plugin functionality.
  public init(): void {
    const editor = this.editor;

    this._setupLinkClickHandler(); // Set up the link click handler for balloon display
    this._registerToolbarButton(); // Register the toolbar button for the modal dialog
  }

  // When a user clicks on an <a> tag in the editing view,
  // we select that link in the model and show the balloon UI.
  private _setupLinkClickHandler(): void {
    const editor = this.editor;
    const uiPlugin = editor.plugins.get(AlightCustomModalLinkPluginUI);

    // Handle clicks on links
    editor.editing.view.document.on('click', (evt, data) => {
      const domTarget = data.domTarget as HTMLElement;

      if (domTarget?.tagName === 'A') {
        evt.stop();
        data.preventDefault();

        const viewNode = editor.editing.view.domConverter.domToView(domTarget);

        // Check if viewNode is an Element and has the required properties
        if (!viewNode || !('is' in viewNode) || !viewNode.is('element')) {
          return;
        }

        const modelElement = editor.editing.mapper.toModelElement(viewNode);

        if (modelElement) {
          // Select the entire link in the model
          editor.model.change((writer) => {
            const range = writer.createRangeOn(modelElement);
            writer.setSelection(range);
          });

          uiPlugin.showBalloon(); // Show the balloon
        }
      }
    });

    // Also respond to selection changes directly
    editor.model.document.selection.on('change:range', () => {
      const selection = editor.model.document.selection;
      if (hasLinkAttribute(selection)) {
        uiPlugin.showBalloon();
      } else {
        uiPlugin.hideBalloon();
      }
    });
  }

  // Register a toolbar button that opens our custom modal (i.e., a second way to insert a link).
  private _registerToolbarButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('alightCustomModalLinkPlugin', (locale) => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Insert Link via Modal',
        tooltip: true,
        withText: true
      });

      // Only enable if selection is not collapsed
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        view.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      // Show our modal on click (for a new link)
      view.on('execute', () => this.showLinkModal());
      return view;
    });
  }

  // Public method to show the link modal.
  // If `existingHref` and `existingOrg` are provided, they will be used
  // to prefill the modal. Otherwise, it's treated as a new link insertion.
  public showLinkModal(existingHref = '', existingOrg = ''): void {
    const editor = this.editor;

    // If no text selected, do nothing (for new insertion)
    if (editor.model.document.selection.isCollapsed) {
      return;
    }

    // Define the modal's options
    const dialogOptions: DialogOptions = {
      modal: true,
      draggable: true,
      resizable: false,
      maximizable: false,
      width: '400px',
      height: 'auto',
      closeOnEscape: true,
      closeOnClickOutside: false,
      overlayOpacity: 0.5,
      headerClass: 'ck-alight-modal-header',
      contentClass: 'ck-alight-modal-content',
      footerClass: 'ck-alight-modal-footer',
      position: 'center',
      buttons: [
        {
          label: 'Cancel',
          className: 'cka-button cka-button-rounded cka-button-outline cka-button-sm',
          variant: 'outlined',
          position: 'left',
          closeOnClick: true
        },
        {
          label: 'Continue',
          className: 'cka-button cka-button-rounded cka-button-sm',
          variant: 'default',
          position: 'right',
          closeOnClick: false
        }
      ],
      defaultCloseButton: true
    };

    // Create the modal dialog
    const modalDialog = new CKAlightModalDialog(dialogOptions);
    modalDialog.setTitle(existingHref ? 'Edit Link' : 'Insert Custom Link');

    // Provide form HTML
    const formHtml = `
      <form id="custom-link-form" class="ck-form">
          <div class="ck-form-group">
              <label for="link-url" class="cka-input-label">
                  URL <span class="ck-required">*</span>
              </label>
              <input type="url"
                     id="link-url"
                     name="link-url"
                     class="cka-input-text"
                     required
                     placeholder="https://" />
          </div>
          <div class="ck-form-group mt-2">
              <label for="org-name" class="cka-input-label">
                  Organization (optional)
              </label>
              <input type="text"
                     id="org-name"
                     name="org-name"
                     class="cka-input-text"
                     placeholder="Organization name" />
          </div>
      </form>
    `;
    modalDialog.setContent(formHtml);

    // Prefill the modal after it's inserted into DOM**
    setTimeout(() => {
      const contentElement = modalDialog.getContentElement();
      if (contentElement) {
        const urlInput = contentElement.querySelector('#link-url') as HTMLInputElement;
        const orgInput = contentElement.querySelector('#org-name') as HTMLInputElement;
        if (urlInput && existingHref) {
          urlInput.value = existingHref;
        }
        if (orgInput && existingOrg) {
          orgInput.value = existingOrg;
        }
      }
    }, 0);

    // Handle the "Continue" button
    modalDialog.on('buttonClick', (buttonLabel: string) => {
      if (buttonLabel === 'Continue') {
        this._handleModalSubmit(modalDialog);
      }
    });

    // Show the modal
    modalDialog.show();
  }

  // Reads the user input from the modal and applies it to the selection.
  private _handleModalSubmit(modalDialog: CKAlightModalDialog): void {
    const contentElement = modalDialog.getContentElement();
    if (!contentElement) return;

    // Get form inputs
    const urlInput = contentElement.querySelector('#link-url') as HTMLInputElement;
    const orgInput = contentElement.querySelector('#org-name') as HTMLInputElement;

    // Validate URL
    const urlValue = urlInput?.value?.trim();
    if (!urlValue) {
      alert('URL is required.');
      return;
    }

    // Get organization value
    const orgValue = orgInput?.value?.trim() || '';

    // Execute the custom link command to apply `customHref`
    this.editor.execute('alightCustomModalLinkPlugin', urlValue);

    // Store organization name (optional, custom logic)
    if (orgValue) {
      const selection = this.editor.model.document.selection;
      const range = selection.getFirstRange();
      if (range) {
        this.editor.model.change((writer) => {
          writer.setAttribute('organizationName', orgValue, range);
        });
      }
    }

    // Close the modal
    modalDialog.hide();

    // Show the balloon
    const uiPlugin = this.editor.plugins.get(AlightCustomModalLinkPluginUI);
    setTimeout(() => {
      uiPlugin.showBalloon();
    }, 100);
  }
}


