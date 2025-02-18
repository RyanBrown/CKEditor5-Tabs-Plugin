// src/plugins/alight-new-document-link-plugin/alight-new-document-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { EventInfo } from '@ckeditor/ckeditor5-utils';
import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-new-document-link-plugin.scss';

export default class AlightNewDocumentLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _formManager?: ContentManager;

  public static get pluginName() {
    return 'AlightNewDocumentLinkPluginUI' as const;
  }

  public init(): void {
    this._setupToolbarButton();
    this._initializeFormManager();
  }

  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightNewDocumentLinkPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('New Document'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Button is always enabled
      button.isEnabled = true;

      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  private _initializeFormManager(): void {
    this._formManager = new ContentManager();
  }

  private _showModal(): void {
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create a New Document',
        modal: true,
        // width: '500px',
        // height: 'auto',
        contentClass: 'new-document-content',
        buttons: [
          {
            label: 'Clear',
            variant: 'outlined',
            position: 'left',
            shape: 'round',
            disabled: false
          },
          {
            label: 'Submit',
            variant: 'default',
            position: 'right',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,
            disabled: false
          }
        ]
      });

      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Clear') {
          this._formManager?.resetSearch();
          return;
        }

        if (label === 'Submit') {
          const formData = this._formManager?.getFormData();
          if (formData) {
            const validation = this._formManager?.validateForm();
            if (validation?.isValid) {
              this._handleFormSubmission(formData);
              this._modalDialog?.hide();
            } else {
              alert(validation?.message);
            }
          }
        }
      });
    }

    // Set modal content using form manager
    if (this._formManager) {
      const container = document.createElement('div');
      this._formManager.renderContent(container);
      this._modalDialog.setContent(container);
      this._modalDialog.show();
    }
  }

  private _handleFormSubmission(formData: any): void {
    const eventInfo = new EventInfo(this, 'newDocumentFormSubmit');
    this.editor.editing.view.document.fire(eventInfo, { formData });
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}