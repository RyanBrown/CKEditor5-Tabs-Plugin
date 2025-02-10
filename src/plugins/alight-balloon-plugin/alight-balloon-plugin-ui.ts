// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin-ui.ts

/**
 * alight-custom-link-plugin-ui.ts
 *
 * A custom UI plugin:
 *  - Adds a new toolbar button "alightBalloonPlugin".
 *  - Shows a custom balloon panel with your own content.
 * 
 * Key changes:
 *  - Using showView() instead of showStack() to avoid TS type errors.
 *  - Converting model range -> view range -> DOM range for balloon positioning.
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange } from './alight-balloon-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range as ModelRange } from '@ckeditor/ckeditor5-engine';
import editIcons from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';

// Helper: Get the linkHref from the current selection (if any).
function getLinkHrefFromSelection(editor: Editor): string | null {
  const model = editor.model;
  const docSelection = model.document.selection;

  if (docSelection.isCollapsed) {
    return null;
  }

  const range = docSelection.getFirstRange();
  if (!range) {
    return null;
  }

  const node = range.start.nodeAfter;
  if (node && 'hasAttribute' in node && typeof node.hasAttribute === 'function') {
    if (node.hasAttribute('linkHref')) {
      const linkHref = node.getAttribute('linkHref');
      if (typeof linkHref === 'string') {
        return linkHref;
      }
    }
  }
  return null;
}

export class AlightBalloonPluginUI extends Plugin {
  private balloon!: ContextualBalloon;
  private formView!: View;

  public static get pluginName() {
    return 'AlightBalloonPluginUI';
  }

  public init(): void {
    const editor = this.editor as Editor;
    this.balloon = editor.plugins.get('ContextualBalloon');

    // Create and store our custom form view
    this.formView = this._createFormView();

    // Register a new toolbar button named "alightBalloonPlugin"
    editor.ui.componentFactory.add('alightBalloonPlugin', locale => {
      const view = new ButtonView(locale);

      view.set({
        label: 'Alight Balloon',
        tooltip: true,
        withText: true
      });

      view.on('execute', () => {
        this._showBalloon();
      });

      return view;
    });
  }

  // Modified _showBalloon method in AlightBalloonPluginUI
  private _showBalloon(): void {
    const editor = this.editor as Editor;
    const model = editor.model;
    const docSelection = model.document.selection;

    // Convert the model range -> view range -> dom range
    const modelRange = getSelectedLinkRange(docSelection);
    let domRange: Range | null = null;

    if (modelRange) {
      const viewRange = editor.editing.mapper.toViewRange(modelRange);
      domRange = editor.editing.view.domConverter.viewRangeToDom(viewRange);
    }

    // Get link href from selection
    const currentHref = getLinkHrefFromSelection(editor) || '';

    // Update the preview once rendered
    this.editor.ui.view.once('render', () => {
      this._updatePreviewLink(currentHref);
    });

    // Remove any existing views first
    if (this.balloon.hasView(this.formView)) {
      this.balloon.remove(this.formView);
    }

    // Add the form view with the new position
    this.balloon.add({
      view: this.formView,
      position: {
        target: domRange || editor.ui.getEditableElement()
      }
    });

    // Make this view visible
    this.balloon.visibleView = this.formView;
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
      icon: editIcons,        // The inline SVG string
      tooltip: true,
      withText: false         // true to display text beside icon
    });
    // If you want an action when clicked:
    editButton.on('execute', () => {
      // For example, run the link command or open a custom UI:
      console.log('Edit link clicked!');
      // editor.execute( 'link' );
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
      console.log('Unlink clicked!');
      // editor.execute( 'unlink' );
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

