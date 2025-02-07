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
    const formView = new View();

    formView.setTemplate({
      tag: 'div',
      // top-level container
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
        tabindex: '-1'
      },
      children: [
        // LABEL
        {
          tag: 'label',
          attributes: {
            class: ['my-label']
          },
          children: ['LABEL']
        },
        // EDIT BUTTON
        {
          tag: 'button',
          attributes: {
            class: 'ck ck-button ck-off',
            type: 'button',
            tabindex: '-1',
            // the ARIA label ID can be the same or dynamic:
            'aria-labelledby': 'ck-editor__aria-label',
            'data-cke-tooltip-text': 'Edit link',
            'data-cke-tooltip-position': 's'
          },
          children: [
            {
              tag: 'button',
              attributes: { class: 'ck ck-button ck-off', type: 'button' },
              children: [
                {
                  tag: 'img',
                  attributes: {
                    src: './assets/icon-pencil.svg',
                    class: 'ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon',
                    'aria-hidden': 'true'
                  }
                },
                {
                  tag: 'span',
                  attributes: { class: 'ck ck-button__label' },
                  children: ['Edit link']
                }
              ]
            }
          ]
        },
        // UNLINK BUTTON
        {
          tag: 'button',
          attributes: {
            class: 'ck ck-button ck-off',
            type: 'button',
            tabindex: '-1',
            'aria-labelledby': 'ck-editor__aria-label',
            'data-cke-tooltip-text': 'Unlink',
            'data-cke-tooltip-position': 's'
          },
          children: [
            {
              tag: 'svg',
              attributes: {
                class: 'ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon',
                viewBox: '0 0 20 20',
                'aria-hidden': 'true'
              },
              children: [
                {
                  tag: 'img',
                  attributes: {
                    src: './assets/icon-unlink.svg',
                    class: 'ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon',
                    'aria-hidden': 'true'
                  }
                },
              ]
            },
            {
              tag: 'span',
              attributes: {
                class: 'ck ck-button__label',
                id: 'ck-editor__aria-label_e17bdab0b56976cd5a52bc05f06b94140'
              },
              children: ['Unlink']
            }
          ]
        }
      ]
    });

    return formView;
  }
}
