// src/plugins/alight-link-url-plugin/alight-link-url-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';

// This is the built-in plugin that manages the link balloon UI.
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import { createLinkFormView } from './alight-link-url-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If you have a custom CSS file for your plugin:
import './styles/alight-link-url-plugin.scss';

// Type describing the shape of the link command value.
interface AlightLinkUrlValue {
  href?: string;
  orgNameText?: string;
}

export default class AlightLinkUrlPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkUrlPluginUI';
  }

  public init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Add a toolbar button for Insert/Edit Link
    editor.ui.componentFactory.add('alightLinkUrlPlugin', (locale: Locale) => {
      const buttonView = createLinkFormView(locale, editor);

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

    const actionsView = linkUI.actionsView;
    const editButtonView = actionsView.editButtonView;
    const unlinkButtonView = actionsView.unlinkButtonView;

    if (!editButtonView || !unlinkButtonView) {
      return;
    }

    // Remove default "Edit link" behavior
    editButtonView.off('execute', () => { });

    // Attach your custom listener
    editButtonView.on('execute', (evt) => {
      evt.stop();
      this.handleLinkButtonClick();
    });

    // Attach your custom listener to remove the link and appended text
    unlinkButtonView.on('execute', (evt) => {
      evt.stop();
      this.handleUnlinkButtonClick();
    });
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
    const currentValue = linkCommand.value as AlightLinkUrlValue | null;
    const currentHref = currentValue?.href ?? '';
    const currentAppendedText = currentValue?.orgNameText ?? '';

    // Execute the command with the existing href and orgNameText. The command will show the modal.
    editor.execute('alightLinkUrlPluginCommand', { href: currentHref, orgNameText: currentAppendedText });
  }

  // Removes the link and appended text.
  private handleUnlinkButtonClick(): void {
    const editor = this.editor;
    const model = editor.model;

    model.change((writer) => {
      const selection = model.document.selection;
      const range = selection.getFirstRange();

      if (range) {
        writer.removeAttribute('linkHref', range);
        writer.removeAttribute('orgNameText', range);
      }
    });
  }
}
