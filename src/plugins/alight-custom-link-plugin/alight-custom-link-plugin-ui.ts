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
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { getSelectedLinkRange } from './alight-custom-link-plugin-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { Range as ModelRange } from '@ckeditor/ckeditor5-engine';
import editIcons from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';

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
        withText: true,
      });

      view.on('execute', () => {
        this._showBalloon();
      });

      return view;
    });
  }

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

    const stackId = 'alightCustomLinkPluginStack';

    // If it's already showing this view, do nothing
    if (this.balloon.visibleView === this.formView) {
      return;
    }

    // If formView is not in the balloon, add it
    if (!this.balloon.hasView(this.formView)) {
      this.balloon.add({
        view: this.formView,
        stackId,
        position: {
          target: domRange || undefined
        }
      });
    }

    // Show the stack by ID
    this.balloon.showStack(stackId);
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
        {
          tag: 'label',
          attributes: {
            class: ['my-label']
          },
          children: ['LABEL']
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
