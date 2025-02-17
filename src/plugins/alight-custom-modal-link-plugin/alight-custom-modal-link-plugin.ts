// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginEditing } from './alight-custom-modal-link-plugin-editing';
import { AlightCustomModalLinkPluginUI } from './alight-custom-modal-link-plugin-ui';
import { hasLinkAttribute } from './alight-custom-modal-link-plugin-utils';
import CkAlightModalDialog, { DialogOptions, DialogButton } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

// The main plugin that ties together:
//  - Our editing plugin (schema, conversion, commands)
//  - Our UI plugin (balloon form, toolbar button)
//  - The custom modal for inserting the link
export default class AlightCustomModalLinkPlugin extends Plugin {
  // We do not rely on the default CKEditor link plugin at all.
  public static get requires() {
    return [AlightCustomModalLinkPluginEditing, AlightCustomModalLinkPluginUI];
  }

  // The plugin name used for registration and retrieval.
  public static get pluginName() {
    return 'AlightCustomModalLinkPlugin';
  }

  private readonly defaultButtons: Record<string, DialogButton> = {
    cancel: {
      label: 'Cancel',
      className: 'cka-button cka-button-rounded cka-button-outline cka-button-sm',
      variant: 'outlined',
      position: 'left',
      closeOnClick: true,
      disabled: false
    },
    continue: {
      label: 'Continue',
      className: 'cka-button cka-button-rounded cka-button-sm',
      variant: 'default',
      position: 'right',
      closeOnClick: false,
      disabled: false,
      isPrimary: true  // Enable Enter key submission
    },
    insert: {
      label: 'Insert',
      className: 'cka-button cka-button-rounded cka-button-sm',
      variant: 'default',
      position: 'right',
      closeOnClick: false,
      disabled: false,
      isPrimary: true  // Enable Enter key submission
    }
  };

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

    // Handle clicks on <a> in the editing view
    editor.editing.view.document.on('click', (evt, data) => {
      const domTarget = data.domTarget as HTMLElement;

      // If user clicked an <a>, prevent navigation and show balloon
      if (domTarget?.tagName === 'A') {
        evt.stop();
        data.preventDefault();

        const viewNode = editor.editing.view.domConverter.domToView(domTarget);

        // Check if viewNode is an Element and has the required properties
        if (!viewNode || !('is' in viewNode) || !viewNode.is('element')) {
          return;
        }

        // Convert the <a> (in the view) to the corresponding model element
        const modelElement = editor.editing.mapper.toModelElement(viewNode);
        if (modelElement) {
          // Select the entire link element in the model
          editor.model.change((writer) => {
            const range = writer.createRangeOn(modelElement);
            writer.setSelection(range);
          });

          // Show the balloon (old behavior => correct position)
          uiPlugin.showBalloon();
        }
      }
    });

    // Also show or hide the balloon if the selection has or loses link attributes
    editor.model.document.selection.on('change:range', () => {
      const selection = editor.model.document.selection;
      if (hasLinkAttribute(selection)) {
        uiPlugin.showBalloon();
      } else {
        uiPlugin.hideBalloon();
      }
    });
  }

  // Registers a toolbar button that opens our custom modal dialog for inserting a new link.
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

      // Show our modal on click
      view.on('execute', () => this.showLinkModal());
      return view;
    });
  }

  private _setupInputValidation(modalDialog: CkAlightModalDialog): void {
    const contentElement = modalDialog.getContentElement();
    if (!contentElement) return;

    const urlInput = contentElement.querySelector('#link-url') as HTMLInputElement;
    const errorMessage = contentElement.querySelector('#error-message') as HTMLDivElement;
    const urlFormGroup = urlInput?.closest('.ck-form-group') as HTMLDivElement;

    urlInput?.addEventListener('input', () => {
      const urlValue = urlInput.value.trim();

      // Clear error state when user starts typing
      urlFormGroup?.classList.remove('has-error');
      errorMessage?.classList.remove('visible');

      // Optional: Show error immediately if URL becomes empty after typing
      if (!urlValue) {
        urlFormGroup?.classList.add('has-error');
        errorMessage?.classList.add('visible');
      }
    });
  }

  // Public method to show the link modal. If `existingHref` / `existingOrg` is provided,
  // we assume this is an edit operation; otherwise it's a new link insertion.
  public showLinkModal(existingHref = '', existingOrg = ''): void {
    const editor = this.editor;

    // For editing, don't check if selection is collapsed
    const isEditing = !!existingHref;
    if (!isEditing && editor.model.document.selection.isCollapsed) {
      return;
    }

    const dialogOptions: DialogOptions = {
      modal: true,
      draggable: true,
      resizable: false,
      width: '400px',
      headerClass: 'ck-alight-modal-header',
      contentClass: 'ck-alight-modal-content',
      footerClass: 'ck-alight-modal-footer',
      submitOnEnter: true,  // Enable Enter key submission
      buttons: [
        this.defaultButtons.cancel,
        {
          ...this.defaultButtons[isEditing ? 'continue' : 'insert'],
          label: isEditing ? 'Continue' : 'Insert'
        }
      ],
      defaultCloseButton: true
    };

    // Create the modal
    const modalDialog = new CkAlightModalDialog(dialogOptions);
    modalDialog.setTitle(isEditing ? 'Edit Link' : 'Insert Custom Link');

    // Simple form with the link URL and optional org name
    const formHtml = `
      <form id="custom-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="link-url" class="cka-input-label">
            URL <span class="ck-required">*</span>
          </label>
          <input
            type="url"
            id="link-url"
            name="link-url"
            class="cka-input-text"
            required
            value="${existingHref}"
            placeholder="https://example.com"
          />
          <div class="error-message" id="error-message">
            Please enter a valid URL.
          </div>
        </div>
        <div class="ck-form-group mt-3">
          <label for="org-name" class="cka-input-label">
            Organization (optional)
          </label>
          <input
            type="text"
            id="org-name"
            name="org-name"
            class="cka-input-text"
            value="${existingOrg}"
            placeholder="Organization name"
          />
        </div>
      </form>
    `;
    modalDialog.setContent(formHtml);

    // Set up input validation
    this._setupInputValidation(modalDialog);

    // Use the modal's event system
    modalDialog.on('buttonClick', (buttonLabel: string) => {
      if (buttonLabel === 'Insert' || buttonLabel === 'Continue') {
        this._handleModalSubmit(modalDialog);
      }
    });

    // Show the modal
    modalDialog.show();
  }

  // Reads the user input and executes the custom link command to apply `customHref`.
  private _handleModalSubmit(modalDialog: CkAlightModalDialog): void {
    const contentElement = modalDialog.getContentElement();
    if (!contentElement) return;

    // Get form elements
    const urlInput = contentElement.querySelector('#link-url') as HTMLInputElement;
    const orgInput = contentElement.querySelector('#org-name') as HTMLInputElement;
    const errorMessage = contentElement.querySelector('#error-message') as HTMLDivElement;
    const urlFormGroup = urlInput?.closest('.ck-form-group') as HTMLDivElement;

    // Clear previous error state
    urlFormGroup?.classList.remove('has-error');
    errorMessage?.classList.remove('visible');

    // Validate URL
    const urlValue = urlInput?.value?.trim();
    if (!urlValue) {
      // Show error message
      urlFormGroup?.classList.add('has-error');
      errorMessage?.classList.add('visible');
      return;
    }

    // URL validation that ignores protocol
    const urlPattern = /^(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?$/i;
    if (!urlPattern.test(urlValue)) {
      // Show error message for invalid URL format
      urlFormGroup?.classList.add('has-error');
      errorMessage?.classList.add('visible');
      return;
    }

    // Ensure URL has a protocol for actual usage
    const finalUrl = urlValue.startsWith('http://') || urlValue.startsWith('https://')
      ? urlValue
      : `https://${urlValue}`;

    // Get organization value
    const orgValue = orgInput?.value?.trim() || '';

    // Execute the link command with the properly formatted URL
    this.editor.execute('alightCustomModalLinkPlugin', finalUrl);

    // Optionally store organization name
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();
    if (range && orgValue) {
      this.editor.model.change(writer => {
        writer.setAttribute('organizationName', orgValue, range);
      });
    }

    // Close the dialog
    modalDialog.hide();

    // Show the balloon for this new link
    const uiPlugin = this.editor.plugins.get(AlightCustomModalLinkPluginUI);
    setTimeout(() => {
      uiPlugin.showBalloon();
    }, 100);
  }
}