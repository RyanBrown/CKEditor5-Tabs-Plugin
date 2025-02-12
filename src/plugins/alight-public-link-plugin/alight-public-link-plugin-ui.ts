// src/plugins/alight-public-link-plugin/alight-public-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ContextualBalloon, ButtonView } from '@ckeditor/ckeditor5-ui';
import { CKAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { getPublicWebsiteContent } from './modal-content/public-website';
import type { Command } from '@ckeditor/ckeditor5-core';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import { safeGetAttribute } from './alight-public-link-plugin-utils';
import type AlightPublicLinkPluginCommand from './alight-public-link-plugin-command';
import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-public-link-plugin.scss';

export default class AlightPublicLinkPluginUI extends Plugin {
  private _balloon: ContextualBalloon;
  private _balloonToolbar: any;

  public static get pluginName() {
    return 'AlightPublicLinkPluginUI' as const;
  }

  public static get requires() {
    return [ContextualBalloon] as const;
  }

  constructor(editor: any) {
    super(editor);
    this._balloon = editor.plugins.get(ContextualBalloon);
    this._balloonToolbar = editor.ui.view.createCollection();
  }

  init(): void {
    this._createToolbarButton();
    this._createBalloonToolbar();
    this._enableBalloonActivators();
  }

  private _createToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    // Register UI component
    editor.ui.componentFactory.add('alightPublicLinkPlugin', (locale: Locale) => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightPublicLinkPlugin') as Command;

      button.set({
        label: t('Insert Public Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Bind button state to command state
      button.bind('isEnabled').to(command);
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
    editButton.on('execute', () => this._showLinkModal());

    // Create unlink button
    const unlinkButton = new ButtonView(editor.locale);
    unlinkButton.set({
      label: t('Unlink'),
      icon: 'unlink',
      tooltip: true
    });
    unlinkButton.on('execute', () => this._unlink());

    this._balloonToolbar.add(editButton);
    this._balloonToolbar.add(unlinkButton);
  }

  private _enableBalloonActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo(viewDocument, 'click', () => {
      const selection = editor.model.document.selection;
      if (selection && selection.hasAttribute('linkHref')) {
        this._showBalloon();
      }
    });
  }

  private _showBalloon(): void {
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range) return;

    const viewRange = this.editor.editing.mapper.toViewRange(range);
    if (!viewRange) return;

    if (!this._balloon.hasView(this._balloonToolbar)) {
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
  }

  private _hideBalloon(): void {
    if (this._balloon.hasView(this._balloonToolbar)) {
      this._balloon.remove(this._balloonToolbar);
    }
  }

  private _unlink(): void {
    const editor = this.editor;
    const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkPluginCommand;

    if (command) {
      command.removeLink();
      this._hideBalloon();
    }
  }

  private _showLinkModal(): void {
    const selection = this.editor.model.document.selection;
    const existingUrl = selection ? safeGetAttribute(selection.getFirstPosition()?.parent, 'linkHref') : null;
    const existingDisplayText = selection ? safeGetAttribute(selection.getFirstPosition()?.parent, 'displayText') : null;

    const formContent = getPublicWebsiteContent({
      href: existingUrl || '',
      orgName: existingDisplayText || ''
    });

    const dialog = new CKAlightModalDialog({
      title: existingUrl ? 'Edit Link' : 'Insert Link',
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
          label: 'Save',
          className: 'cka-button cka-button-primary',
          variant: 'default',
          position: 'right',
          isPrimary: true
        }
      ]
    });

    dialog.setContent(formContent.html);

    // Set up form validation after content is added to DOM
    const dialogElement = dialog.getContentElement();
    if (!dialogElement) return;

    const formValidator = formContent.setup(dialogElement);

    dialog.on('buttonClick', (label: string) => {
      if (label === 'Save') {
        const form = dialogElement.querySelector('form');
        if (form && formValidator.validate()) {
          const formData = new FormData(form);
          const url = formData.get('url') as string;
          const displayText = formData.get('displayText') as string;

          const command = this.editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkPluginCommand;
          if (command) {
            command.execute({ url, displayText });
          }

          dialog.hide();
          this._showBalloon();
        }
      } else if (label === 'Cancel') {
        dialog.hide();
      }
    });

    dialog.show();
  }
}