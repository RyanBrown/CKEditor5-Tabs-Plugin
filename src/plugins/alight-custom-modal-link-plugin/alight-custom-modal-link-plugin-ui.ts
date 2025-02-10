// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange, hasLinkAttribute } from './alight-custom-modal-link-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range } from '@ckeditor/ckeditor5-engine';
import { BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';


// The UI plugin responsible for displaying the link balloon and handling UI interactions.
export class AlightCustomModalLinkPluginUI extends Plugin {

  // The balloon panel used to display the link actions.
  private balloon!: ContextualBalloon;

  // The form view displayed inside the balloon.
  private formView!: View;

  // The plugin's name, used for registration and retrieval.
  public static get pluginName() {
    return 'AlightCustomModalLinkPluginUI';
  }

  // Required plugins.
  public static get requires() {
    return [ContextualBalloon];
  }

  // Initializes the UI plugin.
  public init(): void {
    const editor = this.editor as Editor;

    // Get the balloon from editor's plugins
    this.balloon = editor.plugins.get(ContextualBalloon);

    // Create the form view that will be displayed in the balloon
    this.formView = this._createFormView();

    // Register the toolbar button
    this._registerToolbarButton();

    // Set up selection change handling
    this._setupSelectionChangeHandling();
  }

  // Shows the link balloon at the current selection position.
  public showBalloon(): void {
    const editor = this.editor as Editor;
    const selection = editor.model.document.selection;

    // Get the range for positioning (either link range or selection range)
    const modelRange = getSelectedLinkRange(selection) || selection.getFirstRange();
    if (!modelRange) return;

    // Convert the model range to view and DOM ranges
    const viewRange = editor.editing.mapper.toViewRange(modelRange);
    const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (domRange) {
      const positions = BalloonPanelView.defaultPositions;

      // Add the form view with custom class in the balloon
      const balloonClassName = 'my-modal-class';

      // Add the class to the form view's element
      if (this.formView.element) {
        this.formView.element.classList.add(balloonClassName);
      }

      this.balloon.add({
        view: this.formView,
        position: {
          target: domRange,
          positions: [
            positions.northArrowSouth,
            positions.southArrowNorth,
            positions.eastArrowWest,
            positions.westArrowEast
          ]
        }
      });

      // Update the preview link with current URL
      const linkHref = selection.getAttribute('linkHref');
      if (typeof linkHref === 'string') {
        this._updatePreviewLink(linkHref);
      }
    }
  }

  // Hides the link balloon.
  public hideBalloon(): void {
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }
  }

  // Sets up handling of selection changes.
  private _setupSelectionChangeHandling(): void {
    const editor = this.editor as Editor;

    // Hide balloon when selection changes and doesn't contain a link
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      if (!hasLinkAttribute(editor.model.document.selection)) {
        this.hideBalloon();
      }
    });

    // Hide balloon when editor becomes read-only
    this.listenTo(editor, 'change:isReadOnly', () => {
      this.hideBalloon();
    });

    // Hide balloon when editor loses focus
    this.listenTo(editor.ui.focusTracker, 'change:isFocused', (evt, name, isFocused) => {
      if (!isFocused) {
        this.hideBalloon();
      }
    });
  }

  // Registers the toolbar button.
  private _registerToolbarButton(): void {
    const editor = this.editor as Editor;

    editor.ui.componentFactory.add('alightCustomModalLinkPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: 'My Link',
        icon: editIcon,
        tooltip: true,
        withText: true
      });

      // Update button state based on selection
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        button.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      // Show balloon when button is clicked
      button.on('execute', () => {
        this.showBalloon();
      });

      return button;
    });
  }


  // Updates the preview link in the balloon with the current URL.
  private _updatePreviewLink(linkUrl: string): void {
    if (!this.formView.element) return;

    const previewLink = this.formView.element.querySelector(
      'a.ck-link-actions__preview'
    ) as HTMLAnchorElement | null;

    if (previewLink) {
      // Update href attribute
      previewLink.href = linkUrl;

      // Update displayed text
      const labelSpan = previewLink.querySelector('span.ck-button__label');
      if (labelSpan) {
        labelSpan.textContent = linkUrl;
      }

      // Update title attribute
      previewLink.title = linkUrl;
    }
  }


  // Creates the form view displayed in the balloon.
  private _createFormView(): View {
    const editor = this.editor as Editor;
    const formView = new View(editor.locale);

    // Create edit and unlink buttons
    const editButton = this._createEditButton();
    const unlinkButton = this._createUnlinkButton();

    formView.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-link-actions',
          'ck-responsive-form'
        ],
        tabindex: '-1'
      },
      children: [
        // Link preview
        {
          tag: 'a',
          attributes: {
            class: [
              'ck',
              'ck-link-actions__preview',
              'ck-button',
              'ck-button_with-text'
            ],
            href: '',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          children: [
            {
              tag: 'span',
              attributes: {
                class: ['ck', 'ck-button__label']
              },
              children: ['']
            }
          ]
        },
        // Action buttons container
        {
          tag: 'div',
          attributes: {
            class: [
              'ck',
              'ck-link-actions__buttons'
            ]
          },
          children: [
            editButton,
            unlinkButton
          ]
        }
      ]
    });

    return formView;
  }


  // Creates the edit button for the balloon.
  private _createEditButton(): ButtonView {
    const editor = this.editor as Editor;
    const t = editor.locale.t;
    const editButton = new ButtonView(editor.locale);

    editButton.set({
      label: t('Edit link'),
      icon: editIcon,
      class: 'ck-link-actions__button',
      tooltip: true
    });

    editButton.on('execute', () => {
      // Hide the balloon first
      this.hideBalloon();

      // Get current link URL
      const currentHref = editor.model.document.selection.getAttribute('linkHref');

      // Execute custom link command with current URL
      if (typeof currentHref === 'string') {
        editor.execute('alightCustomLinkPlugin', currentHref);
      }
    });

    return editButton;
  }


  // Creates the unlink button for the balloon.
  private _createUnlinkButton(): ButtonView {
    const editor = this.editor as Editor;
    const t = editor.locale.t;
    const unlinkButton = new ButtonView(editor.locale);

    unlinkButton.set({
      label: t('Unlink'),
      icon: unlinkIcon,
      class: 'ck-link-actions__button',
      tooltip: true
    });

    unlinkButton.on('execute', () => {
      editor.execute('unlink');
      this.hideBalloon();
    });

    return unlinkButton;
  }

  // Destroys the plugin UI.
  public override destroy(): void {
    super.destroy();

    // Destroy the form view
    if (this.formView) {
      this.formView.destroy();
    }
  }
}