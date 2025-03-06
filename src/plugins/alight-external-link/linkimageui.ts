/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightExternalLinkImageui
 */

import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
  DocumentSelection,
  Selection,
  ViewDocumentClickEvent
} from '@ckeditor/ckeditor5-engine';

import type { ImageUtils } from '@ckeditor/ckeditor5-image';

import AlightExternalLinkUI from './linkui';
import AlightExternalLinkEditing from './linkediting';
import type AlightExternalLinkCommand from './linkcommand';

import { LINK_KEYSTROKE } from './utils';

import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

/**
 * The link image UI plugin.
 *
 * This plugin provides the `'AlightExternalLinkImage'` button that can be displayed in the {@link module:image/imagetoolbar~ImageToolbar}.
 * It can be used to wrap images in links.
 */
export default class AlightExternalLinkImageUI extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkEditing, AlightExternalLinkUI, 'ImageBlockEditing'] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkImageUI' as const;
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

        // Block the `AlightExternalLinkUI` plugin when an image was clicked.
        // In such a case, we'd like to display the image toolbar.
        evt.stop();
      }
    }, { priority: 'high' });

    this._createToolbarAlightExternalLinkImageButton();
  }

  /**
   * Creates a `AlightExternalLinkImageUI` button view.
   *
   * Clicking this button shows a {@link module:link/linkui~AlightExternalLinkUI#_balloon} attached to the selection.
   * When an image is already linked, the view shows {@link module:link/linkui~AlightExternalLinkUI#actionsView} or
   * {@link module:link/linkui~AlightExternalLinkUI#formView} if it is not.
   */
  private _createToolbarAlightExternalLinkImageButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('AlightExternalLinkImage', locale => {
      const button = new ButtonView(locale);
      const plugin = editor.plugins.get('AlightExternalLinkUI');
      const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkCommand;

      button.set({
        isEnabled: true,
        label: t('AlightExternalLink image'),
        icon: linkIcon,
        keystroke: LINK_KEYSTROKE,
        tooltip: true,
        isToggleable: true
      });

      // Bind button to the command.
      button.bind('isEnabled').to(linkCommand, 'isEnabled');
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // Show the actionsView or formView (both from AlightExternalLinkUI) on button click depending on whether the image is linked already.
      this.listenTo(button, 'execute', () => {
        if (this._isSelectedLinkedImage(editor.model.document.selection)) {
          plugin._addActionsView();
        } else {
          plugin._showUI(true);
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