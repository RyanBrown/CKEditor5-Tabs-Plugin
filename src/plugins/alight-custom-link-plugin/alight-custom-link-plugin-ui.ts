// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin-ui.ts

/**
 * alight-custom-link-plugin-ui.ts
 *
 * A custom UI plugin:
 *  - Adds a new toolbar button "alightCustomLinkPlugin".
 *  - Shows a custom balloon panel with your own content.
 * 
 * Key changes:
 *  - Using showView() instead of showStack() to avoid TS type errors.
 *  - Converting model range -> view range -> DOM range for balloon positioning.
 *  - Improved link detection and balloon positioning.
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange, hasLinkAttribute } from './alight-custom-link-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range as ModelRange } from '@ckeditor/ckeditor5-engine';
import editIcons from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';

// Helper: Get the linkHref from the current selection (if any).
function getLinkHrefFromSelection(editor: Editor): string | null {
  const model = editor.model;
  const docSelection = model.document.selection;

  // First check the selection attributes
  const linkHref = docSelection.getAttribute('linkHref');
  if (typeof linkHref === 'string') {
    return linkHref;
  }

  // Then check the first node if selection is collapsed
  if (docSelection.isCollapsed) {
    const firstPosition = docSelection.getFirstPosition();
    if (!firstPosition) return null;

    const node = firstPosition.parent;
    if (node && 'hasAttribute' in node && typeof node.hasAttribute === 'function') {
      if (node.hasAttribute('linkHref')) {
        const nodeLinkHref = node.getAttribute('linkHref');
        if (typeof nodeLinkHref === 'string') {
          return nodeLinkHref;
        }
      }
    }
  }

  return null;
}

export class AlightCustomLinkPluginUI extends Plugin {
  private balloon!: ContextualBalloon;
  private formView!: View;

  public static get pluginName() {
    return 'AlightCustomLinkPluginUI';
  }

  public init(): void {
    const editor = this.editor as Editor;
    this.balloon = editor.plugins.get('ContextualBalloon');

    // Create and store our custom form view
    this.formView = this._createFormView();

    // Register a new toolbar button named "alightCustomLinkPlugin"
    editor.ui.componentFactory.add('alightCustomLinkPlugin', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Alight Link',
        tooltip: true,
        withText: true
      });

      view.on('execute', () => {
        this._showBalloon();
      });

      // Update button state based on selection
      this.listenTo(editor.model.document.selection, 'change:range', () => {
        view.isEnabled = !editor.model.document.selection.isCollapsed;
      });

      return view;
    });

    // Hide the balloon when the selection changes without a link
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      if (!hasLinkAttribute(editor.model.document.selection)) {
        this._hideBalloon();
      }
    });
  }

  private _hideBalloon(): void {
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }
  }

  private _showBalloon(): void {
    const editor = this.editor as Editor;
    const selection = editor.model.document.selection;

    // Show balloon for both existing links and new selections
    const modelRange = selection.getFirstRange();

    if (!modelRange || modelRange.isCollapsed) {
      this._hideBalloon();
      return;
    }

    const viewRange = editor.editing.mapper.toViewRange(modelRange);
    const domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (domRange) {
      this.balloon.add({
        view: this.formView,
        position: {
          target: domRange
        }
      });
      this.balloon.visibleView = this.formView;
    }
  }

  // Update the preview link's href and text dynamically.
  private _updatePreviewLink(linkUrl: string) {
    if (!this.formView.element) {
      return;
    }
    const previewLink = this.formView.element.querySelector(
      'a.ck-link-actions__preview'
    ) as HTMLAnchorElement | null;

    if (previewLink) {
      // Update the href
      previewLink.href = linkUrl;

      // Update the displayed text
      const labelSpan = previewLink.querySelector('span.ck-button__label') as HTMLSpanElement | null;
      if (labelSpan) {
        labelSpan.textContent = linkUrl || 'No link selected';
      }
    }
  }

  private _createFormView(): View {
    const editor = this.editor as Editor;
    const locale = editor.locale;

    // 1. Create the parent View for the balloon content
    const formView = new View(locale);

    // 2. Create "Edit link" button
    const editButton = new ButtonView(locale);
    editButton.set({
      label: 'Edit link',
      icon: editIcons,
      tooltip: true,
      withText: false
    });
    // If you want an action when clicked:
    editButton.on('execute', () => {
      const currentHref = getLinkHrefFromSelection(editor);
      if (currentHref) {
        editor.execute('alightLink', currentHref);
      }
      this._hideBalloon();
    });

    // 3. Create "Unlink" button
    const unlinkButton = new ButtonView(locale);
    unlinkButton.set({
      label: 'Unlink',
      icon: unlinkIcon,
      tooltip: true,
      withText: false
    });
    // Action on click:
    unlinkButton.on('execute', () => {
      editor.execute('unlink');
      this._hideBalloon();
    });

    // 4. Set the template so the formView is a simple <div> container
    //    containing the label and both buttons in sequence.
    formView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
        tabindex: '-1'
      },
      children: [
        // PREVIEW LINK (will be updated dynamically)
        {
          tag: 'a',
          attributes: {
            class: 'ck ck-button ck-off ck-button_with-text ck ck-link-actions__preview',
            type: 'button',
            tabindex: '-1',
            'aria-labelledby': 'ck-editor__aria-label',
            'data-cke-tooltip-text': 'Open link in new tab',
            'data-cke-tooltip-position': 's',
            href: '',           // starts blank
            target: '_blank',
            rel: 'noopener noreferrer'
          },
          children: [
            {
              tag: 'span',
              attributes: {
                class: 'ck ck-button__label',
                id: 'ck-editor__aria-label'
              },
              children: [
                // We'll replace this text in _updatePreviewLink()
                'No link selected'
              ]
            }
          ]
        },
        // Insert the two ButtonView instances as children.
        // CKEditor’s UI framework will render them as <button> elements 
        // with .ck-button, .ck-icon, etc.
        editButton,
        unlinkButton
      ]
    });

    return formView;
  }
}