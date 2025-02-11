// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange, hasLinkAttribute } from './alight-custom-modal-link-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range } from '@ckeditor/ckeditor5-engine';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';
import './styles/alight-custom-modal-link-plugin.scss';

// Import the main plugin so we can call its "showLinkModal" method if needed
import AlightCustomModalLinkPlugin from './alight-custom-modal-link-plugin';

// The UI plugin responsible for:
//  - Displaying the custom link balloon with preview, edit, and unlink actions.
//  - Adding a toolbar button to show the balloon.
//  - Controlling balloon visibility on selection changes and clicks outside.
export class AlightCustomModalLinkPluginUI extends Plugin {
  private balloon!: ContextualBalloon; // The balloon panel used to display link actions.
  private formView!: View;            // The form view displayed inside the balloon.

  public static get pluginName() {
    return 'AlightCustomModalLinkPluginUI';
  }

  public static get requires() {
    return [ContextualBalloon];
  }

  public init(): void {
    const editor = this.editor as Editor;

    // Get the contextual balloon instance
    this.balloon = editor.plugins.get(ContextualBalloon);

    // Create the form view that goes inside the balloon
    this.formView = this._createFormView();

    // Register a toolbar button that can also show this custom balloon
    this._registerToolbarButton();

    // Show or hide the balloon automatically when selection changes
    this._setupSelectionChangeHandling();

    // Hide the balloon when user clicks outside of it
    this._setupClickOutsideHandler();
  }

  // Shows the balloon if there's a link in the current selection.
  // Adds a check so we don't try to add the same view again if it's already there.
  public showBalloon(): void {
    const editor = this.editor as Editor;
    const selection = editor.model.document.selection;

    // Get the link range using our utility function
    const modelRange = getSelectedLinkRange(selection);
    if (!modelRange) {
      return;
    }

    // Convert the model range to a DOM range for balloon positioning
    const viewRange = editor.editing.mapper.toViewRange(modelRange);
    const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (domRange) {
      // Default positions for the balloon
      const positions = BalloonPanelView.defaultPositions;

      // If the balloon is already showing our form view, just update position
      if (this.balloon.hasView(this.formView)) {
        // If balloon already has the formView, just update its position
        this.balloon.updatePosition({
          target: domRange,
          positions: [
            positions.northArrowSouth,
            positions.southArrowNorth,
            positions.eastArrowWest,
            positions.westArrowEast
          ]
        });
      } else {
        // Otherwise, add the formView for the first time
        // Add a custom class to the balloon content if needed
        if (this.formView.element) {
          this.formView.element.classList.add('cka-custom-balloon-content');
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
      }

      // Update the preview link with the current href
      const customHref = selection.getAttribute('customHref');
      if (typeof customHref === 'string') {
        this._updatePreviewLink(customHref);
      }
    }
  }

  // Hides the balloon if it's currently visible.
  public hideBalloon(): void {
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }
  }

  // Registers a toolbar button for our link plugin UI.
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

      // Only enable if there's a non-collapsed selection
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        button.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      // Show the balloon on button click
      button.on('execute', () => {
        this.showBalloon();
      });

      return button;
    });
  }

  // Sets up a click-outside handler to hide the balloon if user clicks elsewhere.
  private _setupClickOutsideHandler(): void {
    const editor = this.editor as Editor;
    const viewDocument = editor.editing.view.document;

    this.listenTo(viewDocument, 'click', (evt, data) => {
      const domEvent = data.domEvent as MouseEvent;
      const clickedElement = domEvent.target as HTMLElement;

      if (this.balloon.hasView(this.formView)) {
        const balloonElement = this.balloon.view.element;
        const isClickInBalloon = balloonElement?.contains(clickedElement);
        const isClickOnLink = clickedElement.tagName === 'A';

        // If the click was outside the balloon and not on a link => hide
        if (!isClickInBalloon && !isClickOnLink) {
          this.hideBalloon();
        }
      }
    });
  }

  // Sets up automatic show/hide behavior when the selection changes.
  private _setupSelectionChangeHandling(): void {
    const editor = this.editor as Editor;

    // On selection range change...
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      // Use a short timeout to ensure selection is fully updated
      setTimeout(() => {
        const selection = editor.model.document.selection;
        if (hasLinkAttribute(selection)) {
          // If there's a link, show our balloon if not visible
          if (!this.balloon.hasView(this.formView)) {
            this.showBalloon();
          }
        } else {
          // Otherwise, hide it
          this.hideBalloon();
        }
      }, 50);
    });

    // Hide the balloon when going read-only
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

  // Updates the preview link text inside the balloon to show the current customHref.
  private _updatePreviewLink(linkUrl: string): void {
    if (!this.formView.element) {
      return;
    }

    const previewLink = this.formView.element.querySelector(
      'a.ck-link-actions__preview'
    ) as HTMLAnchorElement | null;

    if (previewLink) {
      // Update the 'href' attribute
      previewLink.href = linkUrl;

      // Update the displayed text
      const labelSpan = previewLink.querySelector('span.ck-button__label');
      if (labelSpan) {
        labelSpan.textContent = linkUrl;
      }

      // Update the title (tooltip)
      previewLink.title = linkUrl;
    }
  }

  // Creates the balloon's form view (with link preview, Edit, and Unlink buttons).
  private _createFormView(): View {
    const editor = this.editor as Editor;
    const formView = new View(editor.locale);

    // Create our Edit and Unlink buttons
    const editButton = this._createEditButton();
    const unlinkButton = this._createUnlinkButton();

    // Build up the balloon content structure
    formView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
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
              attributes: { class: ['ck', 'ck-button__label'] },
              children: ['']
            }
          ]
        },
        // Action buttons container
        {
          tag: 'div',
          attributes: { class: ['ck', 'ck-link-actions__buttons'] },
          children: [editButton, unlinkButton]
        }
      ]
    });

    return formView;
  }

  // Edit button re-opens the modal with existing link data
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

    // **When clicked => hide balloon, then show the modal with existing data.**
    // In your _createEditButton() method:
    editButton.on('execute', () => {
      this.hideBalloon();

      // Safely cast the attributes to string (or do a runtime check).
      const currentHref = (editor.model.document.selection.getAttribute('customHref') as string) || '';
      const currentOrg = (editor.model.document.selection.getAttribute('organizationName') as string) || '';

      // Now currentHref and currentOrg are definitely strings
      const mainPlugin = editor.plugins.get('AlightCustomModalLinkPlugin') as AlightCustomModalLinkPlugin;
      mainPlugin.showLinkModal(currentHref, currentOrg);
    });

    return editButton;
  }

  // Unlink button removes link attributes but keeps the text content
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
      editor.model.change(writer => {
        const selection = editor.model.document.selection;

        // Remove link attributes from all ranges in the selection:
        for (const range of selection.getRanges()) {
          writer.removeAttribute('customHref', range);
          writer.removeAttribute('alightCustomModalLink', range);
          writer.removeAttribute('organizationName', range);
        }

        // Also remove them from the *selection* itself,
        // so they don't get re-applied if the user types immediately:
        writer.removeSelectionAttribute('customHref');
        writer.removeSelectionAttribute('alightCustomModalLink');
        writer.removeSelectionAttribute('organizationName');

        // Optionally re-select the same text, though not strictly required:
        writer.setSelection(selection.getFirstRange());
      });

      // Finally, hide the balloon.
      this.hideBalloon();
    });

    return unlinkButton;
  }

  // Cleans up listeners and destroys the view on plugin teardown.
  public override destroy(): void {
    super.destroy();
    if (this.formView) {
      this.formView.destroy();
    }
  }
}
