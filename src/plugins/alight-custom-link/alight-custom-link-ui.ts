// src/plugins/alight-custom-link/alight-custom-link-ui.ts

/* 
 * Creates and manages a custom balloon panel for your custom link feature,
 * ensuring it only appears for your "dataAlightLink" attribute.
 */
import { Plugin } from '@ckeditor/ckeditor5-core';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LabeledFieldView from '@ckeditor/ckeditor5-ui/src/labeledfield/labeledfieldview';
import { createLabeledInputText } from '@ckeditor/ckeditor5-ui/src/labeledfield/utils';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import View from '@ckeditor/ckeditor5-ui/src/view';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { BalloonPanelView } from '@ckeditor/ckeditor5-ui';

import { getBalloonPositionData } from './alight-custom-link-utils';
import ToolBarIcon from './assets/icon-link.svg';
import CancelButtonIcon from './assets/icon-unlink.svg';
import EditButtonIcon from './assets/icon-pencil.svg';

import './styles/alight-custom-link.scss';

export default class AlightCustomLinkUI extends Plugin {
  declare editor: Editor;

  public static get pluginName(): string {
    return 'AlightCustomLinkUI';
  }

  public static get requires() {
    return [ContextualBalloon];
  }

  private _balloon!: ContextualBalloon;
  private _formView!: LabeledFieldView;
  private _submitButtonView!: ButtonView;
  private _cancelButtonView!: ButtonView;
  private _formContainer!: HTMLDivElement;
  private _formWrapperView!: View;

  // Store the click-outside handler reference.
  private _clickOutsideHandler = (event: MouseEvent): void => {
    if (!this._formContainer.contains(event.target as Node) && this._isBalloonVisible()) {
      this._hideBalloon();
    }
  };

  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon) as ContextualBalloon;
    this._createForm();

    // Register a toolbar button for the custom link feature.
    editor.ui.componentFactory.add('alightCustomLink', locale => {
      const buttonView = new ButtonView(locale);
      buttonView.set({
        icon: ToolBarIcon,
        label: 'Custom Balloon',
        tooltip: true,
        withText: true
      });

      // Toggle the balloon panel on button click.
      buttonView.on('execute', () => {
        if (this._isBalloonVisible()) {
          this._hideBalloon();
        } else {
          this.showBalloon();
        }
      });

      return buttonView;
    });

    // Listen for clicks outside the balloon panel.
    document.addEventListener('mousedown', this._clickOutsideHandler);

    // Optionally hide the balloon when selection changes and the custom link attribute is not present.
    const modelDocument = editor.model.document;
    this.listenTo(modelDocument.selection, 'change:range', () => {
      if (!modelDocument.selection.hasAttribute('dataAlightLink') && this._isBalloonVisible()) {
        this._hideBalloon();
      }
    });
  }

  public override destroy(): void {
    // Remove the event listener on plugin destroy.
    document.removeEventListener('mousedown', this._clickOutsideHandler);
    super.destroy();
  }

  // Creates the custom link form and wraps it in a CKEditor UI View.
  private _createForm(): void {
    const command = this.editor.commands.get('alightCustomLink');

    // Create a labeled input field for the custom link URL.
    this._formView = new LabeledFieldView(this.editor.locale, createLabeledInputText);
    this._formView.label = 'Custom Link URL';
    (this._formView.fieldView as any).placeholder = 'https://example.com';

    if (command) {
      // Cast the fieldView to any so that binding the "value" property works.
      (this._formView.fieldView as any).bind('value').to(command, 'value', (value: string | undefined) => value || '');
    }

    // Create the submit button.
    this._submitButtonView = new ButtonView(this.editor.locale);
    this._submitButtonView.set({
      icon: EditButtonIcon,
      label: 'Apply',
      tooltip: true,
      withText: true
    });
    this._submitButtonView.on('execute', () => {
      const inputElement = this._formView.fieldView.element as HTMLInputElement | null;
      // Use non-null assertion (!) to tell TypeScript the element exists.
      const inputValue = inputElement!.value;
      this.editor.execute('alightCustomLink', { value: inputValue });
      this._hideBalloon();
    });

    // Create the cancel button.
    this._cancelButtonView = new ButtonView(this.editor.locale);
    this._cancelButtonView.set({
      icon: CancelButtonIcon,
      label: 'Cancel',
      tooltip: true,
      withText: true
    });
    this._cancelButtonView.on('execute', () => {
      this._hideBalloon();
    });

    // Create a container for the form.
    this._formContainer = document.createElement('div');
    this._formContainer.classList.add('custom-link-form-container');

    // Render the form view and append it to the container.
    this._formView.render();
    this._formContainer.appendChild(this._formView.element!);

    // Render and append the submit and cancel buttons.
    this._submitButtonView.render();
    this._formContainer.appendChild(this._submitButtonView.element!);

    this._cancelButtonView.render();
    this._formContainer.appendChild(this._cancelButtonView.element!);

    // Wrap the container in a CKEditor UI View.
    this._formWrapperView = new View();
    this._formWrapperView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['custom-link-form-wrapper']
      },
      // Instead of creating child views via the template,
      // we manually insert the already rendered container.
      children: []
    });

    // IMPORTANT: Render the wrapper view so that its element is created.
    this._formWrapperView.render();

    // Now it is safe to append the form container.
    this._formWrapperView.element!.appendChild(this._formContainer);
  }

  // Displays the balloon panel.
  public showBalloon(): void {
    if (this._isBalloonVisible()) {
      return;
    }

    const position = getBalloonPositionData(this.editor);
    if (!position) {
      return;
    }

    // Add the balloon with the proper view and position.
    // Casting to unknown then to any circumvents type mismatches.
    this._balloon.add({
      view: this._formWrapperView,
      position
    } as unknown as any);
  }

  // Hides the balloon panel.
  private _hideBalloon(): void {
    if (this._isBalloonVisible()) {
      this._balloon.remove(this._formWrapperView);
    }
  }

  // Checks whether the balloon panel is currently visible.
  private _isBalloonVisible(): boolean {
    return this._balloon.visibleView === this._formWrapperView;
  }
}
