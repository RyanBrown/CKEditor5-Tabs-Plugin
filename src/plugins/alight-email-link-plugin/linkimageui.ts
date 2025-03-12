// src/plugins/alight-email-link-plugin/linkimageui.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
  DocumentSelection,
  Selection,
  ViewDocumentClickEvent
} from '@ckeditor/ckeditor5-engine';

import type { ImageUtils } from '@ckeditor/ckeditor5-image';

import AlightEmailLinkPluginUI from './linkui';
import AlightEmailLinkPluginEditing from './linkediting';
import type AlightEmailLinkPluginCommand from './linkcommand';

import { LINK_KEYSTROKE } from './utils';

import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

/**
 * The link image UI plugin.
 *
 * This plugin provides the `'AlightEmailLinkPluginImage'` button that can be displayed in the {@link module:image/imagetoolbar~ImageToolbar}.
 * It can be used to wrap images in links.
 */
export default class AlightEmailLinkPluginImageUI extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkPluginEditing, AlightEmailLinkPluginUI, 'ImageBlockEditing'] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLinkPluginImageUI' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', (evt, data) => {
      if (this._isSelectedLinkedImage(editor.model.document.selection)) {
        // Prevent browser navigation when clicking a linked image.
        data.preventDefault();

        // Block the `AlightEmailLinkPluginUI` plugin when an image was clicked.
        // In such a case, we'd like to display the image toolbar.
        evt.stop();
      }
    }, { priority: 'high' });

    this._createToolbarAlightEmailLinkPluginImageButton();
  }

  /**
   * Creates a `AlightEmailLinkPluginImageUI` button view.
   *
   * Clicking this button shows a modal dialog for editing the image link.
   */
  private _createToolbarAlightEmailLinkPluginImageButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('AlightEmailLinkPluginImage', locale => {
      const button = new ButtonView(locale);
      const plugin = editor.plugins.get('AlightEmailLinkPluginUI');
      const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand;

      button.set({
        isEnabled: true,
        label: t('AlightEmailLinkPlugin image'),
        icon: linkIcon,
        keystroke: LINK_KEYSTROKE,
        tooltip: true,
        isToggleable: true
      });

      // Bind button to the command.
      button.bind('isEnabled').to(linkCommand, 'isEnabled');
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // Show the modal dialog UI for editing links
      this.listenTo(button, 'execute', () => {
        if (this._isSelectedLinkedImage(editor.model.document.selection)) {
          // When an image is already linked, show UI for editing the link
          plugin.showUI(true);
        } else {
          // Otherwise show UI for creating a new link
          plugin.showUI();
        }
      });

      return button;
    });
  }

  /**
   * Returns true if a linked image (either block or inline) is the only selected element
   * in the model document.
   */
  private _isSelectedLinkedImage(selection: DocumentSelection | Selection): boolean {
    const selectedModelElement = selection.getSelectedElement();
    const imageUtils: ImageUtils = this.editor.plugins.get('ImageUtils');

    return imageUtils.isImage(selectedModelElement) && selectedModelElement.hasAttribute('linkHref');
  }
}
