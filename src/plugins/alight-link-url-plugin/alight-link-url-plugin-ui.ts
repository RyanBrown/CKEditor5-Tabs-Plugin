// src/plugins/alight-link-url-plugin/alight-link-url-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-url-plugin.scss';

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

      // Clicking the toolbar button => open the modal
      this.listenTo(buttonView, 'execute', () => {
        // Execute the command with the current link (if any)
        this.handleLinkButtonClick();
      });

      return buttonView;
    });
  }

  // afterInit() runs after all plugins (including LinkUI) have initialized.
  // This is where we override the balloon's default "Edit link" button behavior.
  public afterInit(): void {
    const editor = this.editor;

    // Access the built-in LinkUI plugin (manages the balloon)
    const linkUI = editor.plugins.get(LinkUI);
    if (!linkUI?.actionsView) {
      return;
    }

    const editButtonView = linkUI.actionsView.editButtonView;
    const unlinkButtonView = linkUI.actionsView.unlinkButtonView;

    if (editButtonView) {
      editButtonView.on('execute', (evt) => {
        evt.stop();
        this.handleLinkButtonClick();
      });
    }

    if (unlinkButtonView) {
      // Attach your custom listener to remove the link and appended text
      unlinkButtonView.on('execute', (evt) => {
        evt.stop();
        this.handleUnlinkButtonClick();
      });
    }
  }

  // Looks up the current link URL (if any), then calls our command with it.
  private handleLinkButtonClick(): void {
    const editor = this.editor;

    // Our link command is 'alightLinkUrlPluginCommand'
    const linkCommand = editor.commands.get('alightLinkUrlPluginCommand');
    if (!linkCommand) {
      return;
    }

    // Get the current value from the command (this.value = { href, orgNameText } or null)
    const currentValue = linkCommand.value || {};
    editor.execute('alightLinkUrlPluginCommand', currentValue);
  }

  // Removes the link and appended text.
  private handleUnlinkButtonClick(): void {
    const editor = this.editor;

    editor.model.change((writer) => {
      const selection = editor.model.document.selection;
      const range = selection.getFirstRange();

      if (range) {
        // Find and remove the appended organization name text
        const nodes = Array.from(range.getItems());
        let lastNode = nodes[nodes.length - 1];

        if (lastNode && lastNode.is('$text')) {
          const text = lastNode.data;
          const match = text.match(/\s*\([^)]*\)\s*$/);

          if (match) {
            // Create a new range for just the appended text
            const appendedRange = writer.createRange(
              range.end.getShiftedBy(-match[0].length),
              range.end
            );

            // Remove the appended text
            writer.remove(appendedRange);
          }
        }

        // Remove the link attributes from the original text
        writer.removeAttribute('linkHref', range);
        writer.removeAttribute('orgNameText', range);
      }
    });
  }
}
