// src/plugins/alight-public-link-plugin/alight-public-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { LinkUI } from '@ckeditor/ckeditor5-link';
import { CKAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { createPublicLinkModalContent } from './modal-content/public-website';
import type AlightPublicLinkCommand from './alight-public-link-plugin-command';

export default class AlightPublicLinkUI extends Plugin {
  private _modalDialog?: CKAlightModalDialog;

  public static get requires() {
    return [LinkUI];
  }

  public static get pluginName() {
    return 'AlightPublicLinkUI' as const;
  }

  public init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Add toolbar button
    editor.ui.componentFactory.add('alightPublicLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

      button.set({
        label: t('Insert public link'),
        icon: '<svg>...</svg>', // Add your icon SVG
        tooltip: true
      });

      // Bind button state to command state
      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);

      // Handle button click
      this.listenTo(button, 'execute', () => {
        this._showModal();
      });

      return button;
    });

    // Handle balloon editing
    this._handleBalloonEditing();
  }

  private _showModal(initialValue?: string): void {
    const editor = this.editor;
    const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CKAlightModalDialog({
        title: 'Insert Public Link',
        modal: true,
        draggable: true,
        resizable: true,
        width: '400px',
        height: 'auto',
        closeOnEscape: true,
        closeOnClickOutside: true,
        buttons: [
          {
            label: 'Cancel',
            className: 'cka-button',
            variant: 'outlined',
            position: 'left'
          },
          {
            label: 'Insert',
            className: 'cka-button',
            variant: 'default',
            position: 'right',
            isPrimary: true
          }
        ]
      });

      // Handle modal events
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Insert') {
          const linkInput = this._modalDialog?.element?.querySelector('input[name="url"]') as HTMLInputElement;
          if (linkInput && linkInput.value) {
            command.execute(linkInput.value);
          }
        }
      });
    }

    // Set modal content
    const content = createPublicLinkModalContent(initialValue);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  private _handleBalloonEditing(): void {
    const editor = this.editor;
    const linkUI = editor.plugins.get(LinkUI);

    // Override the actionsView's edit button click handler
    this.listenTo(linkUI, 'edit', (evt, data) => {
      evt.stop();
      const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;
      this._showModal(command.value);
    });
  }

  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}