// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange, hasLinkAttribute } from './alight-custom-modal-link-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range } from '@ckeditor/ckeditor5-engine';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';

// The UI plugin responsible for displaying the custom link balloon and handling UI interactions
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

    // Get the contextual balloon instance
    this.balloon = editor.plugins.get(ContextualBalloon);

    // Create the form view that will be displayed in the balloon
    this.formView = this._createFormView();

    // Register the toolbar button
    this._registerToolbarButton();

    // Set up handling of selection changes to force our custom balloon
    this._setupSelectionChangeHandling();
  }

  // Shows the custom link balloon at the current selection position
  public showBalloon(): void {
    const editor = this.editor as Editor;
    const selection = editor.model.document.selection;
    const contextualBalloon = editor.plugins.get('ContextualBalloon');
    const linkUI = editor.plugins.get('LinkUI');

    // Ensure linkUI exists and check if it has added a view to the contextual balloon
    if (linkUI && contextualBalloon.visibleView && contextualBalloon.hasView(contextualBalloon.visibleView)) {
      contextualBalloon.remove(contextualBalloon.visibleView);
    }

    const modelRange = getSelectedLinkRange(selection) || selection.getFirstRange();
    if (!modelRange) {
      return;
    }

    // Convert the model range to view and then to DOM range
    const viewRange = editor.editing.mapper.toViewRange(modelRange);
    const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (domRange) {
      const positions = BalloonPanelView.defaultPositions;

      // Add a custom class to the form view element
      if (this.formView.element) {
        this.formView.element.classList.add('my-modal-class');
      }

      // Add the form view to the balloon at the desired position
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

      // Update the preview link in the balloon with the current URL
      const linkHref = selection.getAttribute('linkHref');
      if (typeof linkHref === 'string') {
        this._updatePreviewLink(linkHref);
      }
    }
  }

  // Hides the custom link balloon
  public hideBalloon(): void {
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }
  }

  // Sets up handling of selection changes.
  // This method listens for changes in the document selection. If the selection
  // contains a link (as determined by the presence of the link attribute), it
  // automatically shows the custom balloon. Otherwise, it hides the balloon
  private _setupSelectionChangeHandling(): void {
    const editor = this.editor as Editor;
    const linkCommand = editor.commands.get('link');

    // Listen to selection changes.
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      // Prevent overriding the built-in link balloon
      if (linkCommand && linkCommand.value) {
        return;
      }

      // Delay opening balloon slightly to avoid race conditions
      // setTimeout(() => {
      //   if (!editor.commands.get('link').value && hasLinkAttribute(editor.model.document.selection)) {
      //     if (!this.balloon.hasView(this.formView)) {
      //       this.showBalloon();
      //     }
      //   } else {
      //     // Otherwise, hide the balloon
      //     this.hideBalloon();
      //   }
      // }, 50);
    });

    // Hide the balloon when the editor becomes read-only
    this.listenTo(editor, 'change:isReadOnly', () => {
      this.hideBalloon();
    });

    // Hide the balloon when the editor loses focus
    this.listenTo(editor.ui.focusTracker, 'change:isFocused', (evt, name, isFocused) => {
      if (!isFocused) {
        this.hideBalloon();
      }
    });
  }

  // Registers the toolbar button that can also trigger the custom balloon
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

      // Enable the button only when text is selected
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        button.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      // Show the balloon when the button is clicked
      button.on('execute', () => {
        this.showBalloon();
      });

      return button;
    });
  }

  // Updates the preview link inside the balloon with the current URL
  // @param linkUrl The URL to display.
  private _updatePreviewLink(linkUrl: string): void {
    if (!this.formView.element) {
      return;
    }

    const previewLink = this.formView.element.querySelector(
      'a.ck-link-actions__preview'
    ) as HTMLAnchorElement | null;

    if (previewLink) {
      // Update the href attribute
      previewLink.href = linkUrl;

      // Update the displayed text
      const labelSpan = previewLink.querySelector('span.ck-button__label');
      if (labelSpan) {
        labelSpan.textContent = linkUrl;
      }

      // Update the title attribute
      previewLink.title = linkUrl;
    }
  }

  // Creates the form view that is displayed in the balloon
  private _createFormView(): View {
    const editor = this.editor as Editor;
    const formView = new View(editor.locale);

    // Create the edit and unlink buttons
    const editButton = this._createEditButton();
    const unlinkButton = this._createUnlinkButton();

    // Set the template for the form view
    formView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
        tabindex: '-1'
      },
      children: [
        {
          tag: 'a',
          attributes: {
            class: ['ck', 'ck-link-actions__preview', 'ck-button', 'ck-button_with-text'],
            href: '',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          children: [
            {
              tag: 'span',
              attributes: { class: ['ck', 'ck-button__label'] },
              children: ['']
            }
          ]
        },
        {
          tag: 'div',
          attributes: { class: ['ck', 'ck-link-actions__buttons'] },
          children: [editButton, unlinkButton]
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

    // On click, hide the balloon and execute the custom link command (with the current URL)
    editButton.on('execute', () => {
      this.hideBalloon();
      const currentHref = editor.model.document.selection.getAttribute('linkHref');
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

    // On click, execute the built-in 'unlink' command and hide the balloon
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
