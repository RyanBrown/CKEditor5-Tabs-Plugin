// src/plugins/alight-link-url-plugin/alight-link-url-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-url-plugin.scss';

// The UI plugin that contributes:
//   1) A toolbar button that opens our "Insert/Edit Link" modal (see `handleLinkButtonClick()`).
//   2) Overridden behavior for the built-in LinkUI's edit/unlink actions (see `afterInit()`).
export default class AlightLinkUrlPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkUrlPluginUI';
  }

  public init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Add a toolbar button for Insert/Edit Link
    editor.ui.componentFactory.add('alightLinkUrlPlugin', (locale: Locale) => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        icon: ToolBarIcon,
        label: t('Insert/Edit Link'),
        tooltip: true,
        withText: true
      });

      // Clicking the toolbar button => open our custom modal
      this.listenTo(buttonView, 'execute', () => {
        this.handleLinkButtonClick();
      });

      return buttonView;
    });
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
