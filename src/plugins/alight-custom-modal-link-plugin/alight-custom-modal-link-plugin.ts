// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { AlightCustomModalLinkPluginEditing } from './alight-custom-modal-link-plugin-editing';
import { AlightCustomModalLinkPluginUI } from './alight-custom-modal-link-plugin-ui';
import CKAlightModalDialog, {
  DialogOptions,
  DialogButton
} from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

// The main plugin class that integrates the custom link functionality.
// This plugin combines the editing and UI features for link handling.

export default class AlightCustomModalLinkPlugin extends Plugin {
  // Required plugins that must be loaded for this plugin to work.
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

    // Set up the link click handler for balloon display
    this._setupLinkClickHandler();

    // Register the toolbar button for the modal dialog
    this._registerToolbarButton();
  }

  // Sets up the handler for link clicks to show the balloon UI.
  private _setupLinkClickHandler(): void {
    const editor = this.editor;
    const uiPlugin = editor.plugins.get(AlightCustomModalLinkPluginUI);

    // Handle clicks on links
    editor.editing.view.document.on('click', (evt, data) => {
      const domTarget = data.domTarget as HTMLElement;

      if (domTarget?.tagName === 'A') {
        const viewNode = editor.editing.view.domConverter.domToView(domTarget);

        // Check if viewNode is an Element and has the required properties
        if (!viewNode || !('is' in viewNode) || !(viewNode.is('element'))) {
          return;
        }

        const viewElement = viewNode;

        const modelElement = editor.editing.mapper.toModelElement(viewElement);

        if (modelElement) {
          // Prevent default link behavior
          evt.stop();
          data.preventDefault();

          // Select the link in the model
          editor.model.change(writer => {
            writer.setSelection(writer.createRangeOn(modelElement));
          });

          // Show the balloon UI
          uiPlugin.showBalloon();
        }
      }
    });

    // Handle Enter key on links
    editor.editing.view.document.on('enter', (evt, data) => {
      const selection = editor.model.document.selection;
      if (selection.hasAttribute('linkHref')) {
        evt.stop();
        data.preventDefault();
        uiPlugin.showBalloon();
      }
    });
  }

  // Registers the toolbar button that opens the link modal dialog.
  private _registerToolbarButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('alightCustomModalLinkPlugin', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Insert Link via Modal',
        tooltip: true,
        withText: true
      });

      // Enable button only when text is selected
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        view.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      // Handle button click
      view.on('execute', () => this._showLinkModal());

      return view;
    });
  }

  // Shows the modal dialog for link insertion/editing.
  private _showLinkModal(): void {
    const editor = this.editor;

    // Don't show modal if no text is selected
    if (editor.model.document.selection.isCollapsed) {
      return;
    }

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
          label: 'Continue',
          className: 'cka-continue-button',
          variant: 'default',
          position: 'right',
          closeOnClick: false
        }
      ],
      defaultCloseButton: true
    };

    // Create and configure the modal dialog
    const modalDialog = new CKAlightModalDialog(dialogOptions);
    modalDialog.setTitle('Insert Custom Link');

    // Create the form HTML
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

    // Handle the Continue button click
    modalDialog.on('buttonClick', (buttonLabel: string) => {
      if (buttonLabel === 'Continue') {
        this._handleModalSubmit(modalDialog);
      }
    });

    // Show the modal dialog
    modalDialog.show();
  }

  // Handles the submission of the link modal form.
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

    // Execute the link command
    this.editor.execute('alightCustomLinkPlugin', urlValue);

    // Store organization data if provided
    if (orgValue) {
      const selection = this.editor.model.document.selection;
      const range = selection.getFirstRange();

      if (range) {
        this.editor.model.change(writer => {
          writer.setAttribute('organizationName', orgValue, range);
        });
      }
    }

    // Close the modal
    modalDialog.hide();
  }
}