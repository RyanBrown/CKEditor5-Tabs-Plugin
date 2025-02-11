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
  private formView!: View;             // The form view displayed inside the balloon.

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

  // Update the showBalloon method in AlightCustomModalLinkPluginUI class
  public showBalloon(): void {
    const editor = this.editor as Editor;
    const selection = editor.model.document.selection;

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
        // Add the formView to the balloon
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

        // Add custom class
        if (this.balloon.view && this.balloon.view.element) {
          this.balloon.view.element.classList.add('cka-custom-balloon-content');
        }
      }

      // Update the preview link text
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

  // Update the preview link text inside the balloon to show the current `customHref`.
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

  // Creates the balloon's form view with preview + Edit + Unlink buttons.
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

  // Edit button => hide balloon, re-open our custom modal pre-filled with current values.
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

    // When clicked => hide balloon, then show the modal with existing data
    editButton.on('execute', () => {
      this.hideBalloon();

      // Get the current selection
      const selection = editor.model.document.selection;

      // Safely get the current attributes
      const currentHref = selection.getAttribute('customHref') || '';
      const currentOrg = selection.getAttribute('organizationName') || '';

      // Show our custom modal for editing
      const mainPlugin = editor.plugins.get('AlightCustomModalLinkPlugin') as AlightCustomModalLinkPlugin;
      mainPlugin.showLinkModal(currentHref.toString(), currentOrg.toString());
    });

    return editButton;
  }

  // The Unlink button => remove link attributes from the entire link text,
  // not just the currently selected portion. This ensures the entire link is gone.
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
        // 1) We start with the *currently* selected portion
        const selection = editor.model.document.selection;
        // 2) Expand that selection across all text nodes that have `customHref`
        const linkRange = this._expandLinkRange(selection);
        if (!linkRange) {
          return;
        }

        // 3) Remove link attributes from that expanded range
        writer.removeAttribute('customHref', linkRange);
        writer.removeAttribute('alightCustomModalLink', linkRange);
        writer.removeAttribute('organizationName', linkRange);

        // 4) Also remove from the selection so it doesn't re-apply automatically
        writer.removeSelectionAttribute('customHref');
        writer.removeSelectionAttribute('alightCustomModalLink');
        writer.removeSelectionAttribute('organizationName');

        // (Optional) You might want to set selection back to linkRange, or
        // place the selection after the linkRange, etc. We'll just do:
        writer.setSelection(linkRange.end);
      });

      // Hide the balloon after unlinking
      this.hideBalloon();
    });

    return unlinkButton;
  }

  // Expand the selection across all text nodes with `customHref`,
  // ensuring we remove attributes from the entire link.
  private _expandLinkRange(selection: any) {
    // If there's no link attribute, bail out
    const href = selection.getAttribute('customHref');
    if (!href) {
      return null;
    }

    // Get the first range in the selection
    const firstRange = selection.getFirstRange();
    if (!firstRange) {
      return null;
    }

    let start = firstRange.start;
    let end = firstRange.end;

    // Expand backward
    while (
      start.nodeBefore &&
      start.nodeBefore.hasAttribute &&
      start.nodeBefore.hasAttribute('customHref')
    ) {
      start = start.getShiftedBy(-1);
    }

    // Expand forward
    while (
      end.nodeAfter &&
      end.nodeAfter.hasAttribute &&
      end.nodeAfter.hasAttribute('customHref')
    ) {
      end = end.getShiftedBy(1);
    }

    return this.editor.model.createRange(start, end);
  }

  public override destroy(): void {
    super.destroy();
    if (this.formView) {
      this.formView.destroy();
    }
  }
}
