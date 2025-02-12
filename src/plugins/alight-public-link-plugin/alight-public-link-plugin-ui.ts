// src/plugins/alight-public-link-plugin/alight-public-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ContextualBalloon, ButtonView } from '@ckeditor/ckeditor5-ui';
import { CKAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { getPublicWebsiteContent } from './modal-content/public-website';

import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-public-link-plugin.scss';

export default class AlightPublicLinkPluginUI extends Plugin {
  private _balloon!: ContextualBalloon;
  private _balloonToolbar: any;

  public static get requires() {
    return [ContextualBalloon] as const;
  }

  init(): void {
    this._balloon = this.editor.plugins.get(ContextualBalloon);
    this._balloonToolbar = this.editor.ui.view.createCollection();

    this._createToolbarButton();
    this._createBalloonToolbar();
    this._enableBalloonActivators();
  }

  private _createToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;
    const command = editor.commands.get('alightPublicLinkPlugin');

    editor.ui.componentFactory.add('alightPublicLinkPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('Insert Public Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Bind button state to command state
      button.bind('isEnabled').to(command, 'isEnabled');

      button.on('execute', () => this._showLinkModal());

      return button;
    });
  }

  private _createBalloonToolbar(): void {
    const editor = this.editor;
    const t = editor.t;

    // Create edit button
    const editButton = new ButtonView(editor.locale);
    editButton.set({
      label: t('Edit link'),
      icon: 'pencil',
      tooltip: true
    });
    editButton.on('execute', () => {
      this._hideBalloon();
      this._showLinkModal(true);
    });

    // Create unlink button
    const unlinkButton = new ButtonView(editor.locale);
    unlinkButton.set({
      label: t('Unlink'),
      icon: 'unlink',
      tooltip: true
    });
    unlinkButton.on('execute', () => {
      const command = editor.commands.get('alightPublicLinkPlugin');
      command.removeLink();
      this._hideBalloon();
    });

    this._balloonToolbar.add(editButton);
    this._balloonToolbar.add(unlinkButton);
  }

  private _enableBalloonActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    // Show balloon on link click
    this.listenTo(viewDocument, 'click', () => {
      const selection = editor.model.document.selection;

      if (selection.hasAttribute('linkHref')) {
        this._showBalloon();
      }
    });

    // Hide balloon when selection changes
    this.listenTo(editor.model.document, 'change:data', () => {
      const selection = editor.model.document.selection;

      if (!selection.hasAttribute('linkHref')) {
        this._hideBalloon();
      }
    });
  }

  private _showBalloon(): void {
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range) return;

    const viewRange = this.editor.editing.mapper.toViewRange(range);

    this._balloon.add({
      view: this._balloonToolbar,
      position: {
        target: () => {
          const domRange = this.editor.editing.view.domConverter.viewRangeToDom(viewRange);
          return domRange || null;
        }
      }
    });
  }

  private _hideBalloon(): void {
    if (this._balloon.hasView(this._balloonToolbar)) {
      this._balloon.remove(this._balloonToolbar);
    }
  }

  private _showLinkModal(isEdit: boolean = false): void {
    const command = this.editor.commands.get('alightPublicLinkPlugin');
    let currentValues = { url: '', displayText: '' };

    if (isEdit) {
      currentValues = command.getCurrentLinkAttributes() || currentValues;
    }

    const formContent = getPublicWebsiteContent({
      href: currentValues.url,
      orgName: currentValues.displayText
    });

    const dialog = new CKAlightModalDialog({
      title: isEdit ? 'Edit Public Link' : 'Insert Public Link',
      width: '500px',
      modal: true,
      buttons: [
        {
          label: 'Cancel',
          className: 'cka-button',
          variant: 'outlined',
          position: 'left'
        },
        {
          label: isEdit ? 'Update' : 'Insert',
          className: 'cka-button cka-button-primary',
          variant: 'default',
          position: 'right',
          isPrimary: true
        }
      ]
    });

    dialog.setContent(formContent.html);

    const dialogElement = dialog.getContentElement();
    if (!dialogElement) return;

    const formValidator = formContent.setup(dialogElement);

    dialog.on('buttonClick', (label: string) => {
      if (label === 'Update' || label === 'Insert') {
        const form = dialogElement.querySelector('form');
        if (form && formValidator.validate()) {
          const formData = new FormData(form);
          command.execute({
            url: formData.get('url') as string,
            displayText: formData.get('displayText') as string
          });
          dialog.hide();
        }
      } else if (label === 'Cancel') {
        dialog.hide();
      }
    });

    dialog.show();
  }
}