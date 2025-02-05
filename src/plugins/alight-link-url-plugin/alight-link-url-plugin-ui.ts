// src/plugins/alight-link-url-plugin/alight-link-url-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { LinkFormView, createLinkFormView } from './alight-link-url-plugin-utils';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import { CKAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-url-plugin.scss';

// The UI plugin that contributes:
//   1) A toolbar button that opens our "Insert/Edit Link" modal (see `handleLinkButtonClick()`).
//   2) Overridden behavior for the built-in LinkUI's edit/unlink actions (see `afterInit()`).
export default class AlightLinkUrlPluginUI extends Plugin {
  public formView: LinkFormView | null = null;
  private _balloon!: ContextualBalloon;
  private dialog: CKAlightModalDialog | null = null;

  static get requires() {
    return [ContextualBalloon];
  }

  static get pluginName() {
    return 'AlightLinkUrlPluginUI';
  }

  public init(): void {
    const editor = this.editor;

    // Get the balloon instance
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Add toolbar button
    this._createToolbarLinkButton();

    // Enable custom balloon interactions
    this._enableBalloonActivators();
  }

  private _createToolbarLinkButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightLinkUrlPlugin', (locale: Locale) => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: t('Link'),
        icon: ToolBarIcon,
        tooltip: true,
        class: 'alight-link-url-plugin-button'
      });

      // Show modal for new links, balloon for editing
      buttonView.on('execute', () => {
        const selection = editor.model.document.selection;
        const hasLinkAtSelection = selection.getAttribute('linkHref');

        if (hasLinkAtSelection) {
          this._showBalloonUI();
        } else {
          this._showModalUI();
        }
      });

      return buttonView;
    });
  }

  private _showModalUI(): void {
    this.dialog = new CKAlightModalDialog({
      width: '500px',
      modal: true,
      draggable: false,
      maximizable: false,
    });

    this.dialog.setTitle('Insert Link');
    this.dialog.setContent(`
      <div class="ck-custom-modal-content">
        <div class="form-group">
          <label for="linkUrl" class="cka-input-label">URL:</label>
          <input
            class="cka-input-text"
            id="linkUrl"
            placeholder="https://example.com"
            type="url"
            value="" />
        </div>
        <div class="form-group">
          <label for="orgNameText" class="cka-input-label">Org Name</label>
          <input
            class="cka-input-text"
            id="orgNameText"
            placeholder="Organization Name"
            type="text"
            value="" />
        </div>
      </div>
    `);

    // Add footer buttons using the dialog's API
    const footerContent = document.createElement('div');
    footerContent.innerHTML = `
      <button class="ck-button secondary">Cancel</button>
      <button class="ck-button primary">Insert</button>
    `;

    this.dialog.setFooter(footerContent);

    // Handle button clicks
    const buttons = footerContent.querySelectorAll('button');
    buttons[0]?.addEventListener('click', () => this.dialog?.destroy());
    buttons[1]?.addEventListener('click', () => this._handleModalSubmit());

    this.dialog.show();
  }

  private _showBalloonUI(): void {
    const balloonView = new View(this.editor.locale);

    // Create the balloon content using proper template definition
    balloonView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-balloon-content']
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: ['ck-link-actions']
          },
          children: [
            {
              tag: 'div',
              attributes: {
                class: ['ck-link-actions__preview']
              },
              children: [
                {
                  tag: 'a',
                  attributes: {
                    class: ['ck-link-actions__preview-link'],
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    href: this._getSelectedLinkText()
                  },
                  children: [
                    {
                      text: this._getSelectedLinkText()
                    }
                  ]
                }
              ]
            },
            {
              tag: 'div',
              attributes: {
                class: ['ck-link-actions__buttons']
              },
              children: [
                {
                  tag: 'button',
                  attributes: {
                    class: ['ck-button', 'ck-button-edit']
                  },
                  children: [{ text: 'Edit' }]
                },
                {
                  tag: 'button',
                  attributes: {
                    class: ['ck-button', 'ck-button-unlink']
                  },
                  children: [{ text: 'Unlink' }]
                }
              ]
            }
          ]
        }
      ]
    });

    this._balloon.add({
      view: balloonView,
      position: this._getBalloonPositionData()
    });

    // Add event listeners to balloon buttons
    const element = balloonView.element;
    if (element) {
      const editButton = element.querySelector('.ck-button-edit');
      const unlinkButton = element.querySelector('.ck-button-unlink');

      editButton?.addEventListener('click', () => this._showModalUI());
      unlinkButton?.addEventListener('click', () => {
        this.editor.execute('alightLinkUrlPluginCommand', { href: '' });
        this._hideBalloon();
      });
    }
  }

  private _getSelectedLinkText(): string {
    const selection = this.editor.model.document.selection;
    const href = selection.getAttribute('linkHref') as string;
    return href || '';
  }

  private _hideBalloon(): void {
    if (this._balloon.hasView(this.formView!)) {
      this._balloon.remove(this.formView!);
    }
  }

  private _handleModalSubmit(): void {
    if (!this.dialog) return;

    const content = this.dialog.getContentElement();
    if (!content) return;

    const urlInput = content.querySelector('#linkUrl') as HTMLInputElement;
    const orgNameInput = content.querySelector('#orgNameText') as HTMLInputElement;

    const linkData = {
      href: urlInput?.value || '',
      orgNameText: orgNameInput?.value || ''
    };

    this.editor.execute('alightLinkUrlPluginCommand', linkData);
    this.dialog.destroy();
  }

  private _getBalloonPositionData() {
    const editor = this.editor;
    const view = editor.editing.view;
    const viewDocument = view.document;

    return {
      target: view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange()!)
    };
  }

  private _enableBalloonActivators(): void {
    const editor = this.editor;

    // Handle clicking on existing links
    editor.editing.view.document.on('click', (evt, data) => {
      if (this._isClickOnLink(data)) {
        this._showBalloonUI();
        evt.stop();
      }
    });

    // Handle Ctrl+K shortcut
    editor.keystrokes.set('Ctrl+K', (data, cancel) => {
      const hasLink = editor.model.document.selection.getAttribute('linkHref');
      if (hasLink) {
        this._showBalloonUI();
      } else {
        this._showModalUI();
      }
      cancel();
    });
  }

  private _isClickOnLink(data: any): boolean {
    const element = data.target;
    return element && element.is('element', 'a');
  }

  // `afterInit()` runs after all plugins (including LinkUI) have initialized.
  // We intercept the built-in LinkUI's unlink button so we can:
  //   - stop the default unlink,
  //   - remove our appended `<span class="org-name-append">...</span>`,
  //   - remove link attributes from the selection.
  public afterInit(): void {
    const editor = this.editor;
    const linkUI = editor.plugins.get(LinkUI);

    // Bail if LinkUI does not exist or is missing the actionsView
    if (!linkUI?.actionsView) {
      return;
    }

    // The built-in Edit button in the balloon
    const editButtonView = linkUI.actionsView.editButtonView;
    // The built-in Unlink button in the balloon
    const unlinkButtonView = linkUI.actionsView.unlinkButtonView;

    // Intercept the "Edit link" button => open our custom modal
    if (editButtonView) {
      editButtonView.on('execute', (evt) => {
        evt.stop();
        this.handleLinkButtonClick();
      });
    }

    // Intercept the "Unlink" button => remove link + appended spans
    if (unlinkButtonView) {
      unlinkButtonView.on('execute', (evt) => {
        evt.stop();
        this.handleUnlinkButtonClick();
      });
    }
  }

  // When the "Insert/Edit Link" toolbar or balloon button is clicked,
  // grab the current link data and launch our custom command's modal.
  private handleLinkButtonClick(): void {
    const editor = this.editor;
    // "alightLinkUrlPluginCommand" is our custom link command
    const linkCommand = editor.commands.get('alightLinkUrlPluginCommand');

    if (!linkCommand) {
      return;
    }

    // If the selection already has a link, linkCommand.value = { href, orgNameText }
    const currentValue = linkCommand.value || {};
    editor.execute('alightLinkUrlPluginCommand', currentValue);
  }

  /**
   * Overrides default "unlink" to also remove the appended `<span class="org-name-append">`.
   */
  private handleUnlinkButtonClick(): void {
    const editor = this.editor;

    editor.model.change((writer) => {
      // 1) Remove link attributes from the current selection
      const selection = editor.model.document.selection;
      const range = selection.getFirstRange();

      if (!range) {
        return;
      }

      writer.removeAttribute('linkHref', range);
      writer.removeAttribute('orgNameText', range);

      // 2) Remove any <orgNameSpan> that is inside or immediately after the selection
      //    so the appended text goes away with the link.
      //    We'll look for orgNameSpan elements in the selection range
      //    AND check if there's an `orgNameSpan` node right after the range.

      // Remove orgNameSpan in the selection range
      const itemsInRange = Array.from(range.getItems());
      itemsInRange.forEach((item) => {
        if (item.is('element', 'orgNameSpan')) {
          writer.remove(writer.createRangeOn(item));
        }
      });

      // Remove any orgNameSpan that appears immediately after the selection
      const nodeAfter = range.end.nodeAfter;
      if (nodeAfter && nodeAfter.is('element', 'orgNameSpan')) {
        writer.remove(writer.createRangeOn(nodeAfter));
      }
    });
  }
}
