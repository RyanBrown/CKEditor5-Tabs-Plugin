/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link/AlightLinkImageui
 */

import { ButtonView } from 'ckeditor5/src/ui';
import { Plugin } from 'ckeditor5/src/core';
import type {
  DocumentSelection,
  Selection,
  ViewDocumentClickEvent
} from 'ckeditor5/src/engine';

import type { ImageUtils } from '@ckeditor/ckeditor5-image';

import AlightLinkUI from './linkui';
import AlightLinkEditing from './linkediting';
import type AlightLinkCommand from './linkcommand';

import { LINK_KEYSTROKE } from './utils';

import linkIcon from '../theme/icons/link.svg';

/**
 * The link image UI plugin.
 *
 * This plugin provides the `'AlightLinkImage'` button that can be displayed in the {@link module:image/imagetoolbar~ImageToolbar}.
 * It can be used to wrap images in links.
 */
export default class AlightLinkImageUI extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightLinkEditing, AlightLinkUI, 'ImageBlockEditing'] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightLinkImageUI' as const;
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

        // Block the `AlightLinkUI` plugin when an image was clicked.
        // In such a case, we'd like to display the image toolbar.
        evt.stop();
      }
    }, { priority: 'high' });

    this._createToolbarAlightLinkImageButton();
  }

  /**
   * Creates a `AlightLinkImageUI` button view.
   *
   * Clicking this button shows a {@link module:link/linkui~AlightLinkUI#_balloon} attached to the selection.
   * When an image is already linked, the view shows {@link module:link/linkui~AlightLinkUI#actionsView} or
   * {@link module:link/linkui~AlightLinkUI#formView} if it is not.
   */
  private _createToolbarAlightLinkImageButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('AlightLinkImage', locale => {
      const button = new ButtonView(locale);
      const plugin = editor.plugins.get('AlightLinkUI');
      const linkCommand = editor.commands.get('alight-link') as AlightLinkCommand;

      button.set({
        isEnabled: true,
        label: t('AlightLink image'),
        icon: linkIcon,
        keystroke: LINK_KEYSTROKE,
        tooltip: true,
        isToggleable: true
      });

      // Bind button to the command.
      button.bind('isEnabled').to(linkCommand, 'isEnabled');
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // Show the actionsView or formView (both from AlightLinkUI) on button click depending on whether the image is linked already.
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