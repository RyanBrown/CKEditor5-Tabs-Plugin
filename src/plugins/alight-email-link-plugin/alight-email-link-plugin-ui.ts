// src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts

// Import necessary classes and components from CKEditor5.
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import { getSelectedLinkElement } from './alight-email-link-plugin-utils';
import toolBarIcon from './assets/icon-link.svg';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';
import './styles/alight-email-link-plugin.scss';
// Import the default LinkUI plugin to access its actions view.
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
// Import the view element type.
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';

/**
 * The UI component of the email link plugin.
 * Handles the toolbar button, modal dialog, and contextual balloon.
 */
export default class AlightEmailLinkPluginUI extends Plugin {
  // Holds the reference to the contextual balloon instance.
  private _balloon?: ContextualBalloon;
  // Holds the reference to the actions view displayed in the balloon.
  private _actionsView?: View;
  // Holds the reference to the modal dialog.
  private _modalDialog?: CkAlightModalDialog;

  /**
   * Specifies the required plugins.
   */
  public static get requires() {
    return [ContextualBalloon];
  }

  /**
   * Returns the plugin name.
   */
  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  /**
   * Initializes the plugin by setting up schema, converters, commands, toolbar button,
   * click handling, and balloon handling.
   */
  public init(): void {
    const editor = this.editor;

    // Get the balloon plugin instance.
    this._balloon = editor.plugins.get(ContextualBalloon);
    // Create the actions view by merging the default LinkUI actions view with our custom content.
    this._actionsView = this._createActionsView();
    // Add click observer for handling link clicks.
    editor.editing.view.addObserver(ClickObserver);
    // Setup the toolbar button, click handling, and balloon handling.
    this._setupToolbarButton();
    this._setupClickHandling();
    this._setupBalloonHandling();
  }

  /**
   * Sets up the toolbar button for inserting or editing an email link.
   */
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightEmailLinkPlugin');

      if (!command) {
        console.warn('[AlightEmailLinkPluginUI] AlightEmailLinkPlugin command not found.');
        return button;
      }

      button.set({
        label: t('Email Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);

      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  /**
   * Sets up click handling for detecting and interacting with links in the editor.
   */
  private _setupClickHandling(): void {
    const editor = this.editor;

    this.listenTo(editor.editing.view.document, 'click', (evt, data) => {
      const domEvent = data.domEvent as MouseEvent;
      const domElement = domEvent.target as HTMLElement;

      if (domElement.tagName === 'A') {
        evt.stop();
        data.preventDefault();

        const viewElement = editor.editing.view.domConverter.domToView(domElement);
        if (viewElement && viewElement.is('element')) {
          const modelElement = editor.editing.mapper.toModelElement(viewElement);
          if (modelElement) {
            editor.model.change(writer => {
              writer.setSelection(writer.createRangeOn(modelElement));
            });
            this._updateBalloonVisibility();
          }
        }
      }
    });

    this.listenTo(editor.ui.focusTracker, 'change:isFocused', () => {
      console.log('[AlightEmailLinkPluginUI] Focus changed. Updating balloon visibility.');
      this._updateBalloonVisibility();
    });
  }

  /**
   * Sets up balloon handling for showing link actions when a link is selected.
   */
  private _setupBalloonHandling(): void {
    const editor = this.editor;

    this.listenTo(editor.model.document.selection, 'change:range', () => {
      console.log('[AlightEmailLinkPluginUI] Selection range changed. Updating balloon visibility.');
      this._updateBalloonVisibility();
    });
  }

  /**
   * Consolidated function to update the balloon's visibility based on focus and selection.
   * Also applies the 'ck-link_selected' class to the link if it is focused.
   */
  private _updateBalloonVisibility(): void {
    const editor = this.editor;
    const command = editor.commands.get('alightEmailLinkPlugin');
    const hasFocus = editor.ui.focusTracker.isFocused;

    // Use helper to get the selected link view element and cast it to a view element.
    const selectedLinkView = getSelectedLinkElement(editor) as unknown as ViewElement;
    const hasLinkSelected = !!selectedLinkView;

    console.log('[AlightEmailLinkPluginUI] _updateBalloonVisibility: hasFocus =', hasFocus, ', hasLinkSelected =', hasLinkSelected);

    if (hasFocus && hasLinkSelected && selectedLinkView) {
      editor.editing.view.change(writer => writer.addClass('ck-link_selected', selectedLinkView));
      this._showBalloon();
    } else {
      if (selectedLinkView) {
        editor.editing.view.change(writer => writer.removeClass('ck-link_selected', selectedLinkView));
      }
      this._hideBalloon();
    }
  }

  /**
   * Creates the actions view displayed in the balloon by merging the default LinkUI actions view
   * with a custom content view.
   * @returns The created merged view.
   */
  private _createActionsView(): View {
    const editor = this.editor;
    let defaultActionsView: View | undefined;
    try {
      // Attempt to retrieve the default LinkUI plugin's actions view.
      const linkUI: any = editor.plugins.get('LinkUI');
      defaultActionsView = linkUI.actionsView;
      console.log('[AlightEmailLinkPluginUI] Retrieved default LinkUI actions view.');
    } catch (error) {
      console.warn('[AlightEmailLinkPluginUI] Default LinkUI actions view not found, using fallback.');
    }

    // Create our custom content view.
    const customContentView = new MyCustomContentView(editor.locale);
    customContentView.render();

    // If we retrieved the default actions view, merge our custom view into it.
    if (defaultActionsView) {
      // Cast to any to allow modifying the children array.
      (defaultActionsView as any).children.push(customContentView);
      return defaultActionsView;
    } else {
      // Fallback: use our own custom ActionsView.
      return new ActionsView(editor.locale);
    }
  }

  /**
   * Shows the balloon with link actions near the selected link.
   */
  private _showBalloon(): void {
    if (!this._balloon || !this._actionsView) {
      console.warn('[AlightEmailLinkPluginUI] Balloon or actions view not available.');
      return;
    }

    const command = this.editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;
    const linkUrl = command.value?.email || '';

    // Update URL display in the actions view.
    if (this._actionsView instanceof ActionsView) {
      this._actionsView.updateLinkDisplay(linkUrl);
    } else {
      // If using the default LinkUI actions view, you may update its properties accordingly.
      // (Remove unsupported "set('url', linkUrl)" call.)
      console.log('[AlightEmailLinkPluginUI] Using default LinkUI actions view; update custom URL handling as needed.');
    }

    const positions = BalloonPanelView.defaultPositions;
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range) {
      console.warn('[AlightEmailLinkPluginUI] No selection range found.');
      return;
    }

    const viewRange = this.editor.editing.mapper.toViewRange(range);
    const domRange = this.editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (!domRange) {
      console.warn('[AlightEmailLinkPluginUI] DOM range conversion failed.');
      return;
    }

    if (this._balloon.hasView(this._actionsView)) {
      this._balloon.updatePosition({
        target: domRange,
        positions: [
          positions.northArrowSouth,
          positions.southArrowNorth,
          positions.eastArrowWest,
          positions.westArrowEast
        ]
      });
    } else {
      this._balloon.add({
        view: this._actionsView,
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
  }

  /**
   * Hides the balloon if it is currently visible.
   */
  private _hideBalloon(): void {
    if (this._balloon && this._actionsView && this._balloon.hasView(this._actionsView)) {
      this._balloon.remove(this._actionsView);
    }
  }

  /**
   * Shows the modal dialog for creating or editing an email link.
   * @param initialValue Optional initial values for the email link.
   */
  public _showModal(initialValue?: { email: string; orgName?: string }): void {
    const editor = this.editor;
    const command = editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;
    const initialEmail = initialValue?.email || '';
    const initialOrgName = initialValue?.orgName || '';

    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Create an Email Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'email-link-content',
        buttons: [
          {
            label: 'Cancel',
            variant: 'outlined',
            shape: 'round',
            disabled: false
          },
          {
            label: 'Continue',
            variant: 'default',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,
            disabled: false
          }
        ]
      });

      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const isValid = validateForm(form);

          if (isValid) {
            const emailInput = form?.querySelector('#link-email') as HTMLInputElement;
            const orgNameInput = form?.querySelector('#org-name') as HTMLInputElement;

            command.execute({
              email: emailInput.value,
              orgName: orgNameInput?.value || undefined
            });
            this._modalDialog?.hide();
          }
        }
      });
    }

    const content = ContentManager(initialEmail, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  /**
   * Destroys the plugin and cleans up resources.
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
    if (this._actionsView && this._actionsView.destroy) {
      this._actionsView.destroy();
    }
  }
}

/**
 * A custom ActionsView used as a fallback if the default LinkUI actions view is not available.
 * Provides buttons for editing and unlinking, as well as a URL preview.
 */
class ActionsView extends View {
  public readonly editButtonView: ButtonView;
  public readonly unlinkButtonView: ButtonView;
  public readonly linkURLView: View;
  private _urlText: string = '';

  constructor(locale: any) {
    super(locale);

    this.editButtonView = this._createButton('Edit link', editIcon);
    this.unlinkButtonView = this._createButton('Unlink', unlinkIcon);
    this.linkURLView = this._createURLPreview();

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-actions', 'ck-responsive-form', 'alight-link-actions'],
      },
      children: [
        this.linkURLView,
        this.editButtonView,
        this.unlinkButtonView
      ]
    });
  }

  /**
   * Updates the URL display in the balloon.
   * @param url The URL to display.
   */
  public updateLinkDisplay(url: string): void {
    this._urlText = url;
    this.linkURLView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'updateLinkDisplay', 'ck-link-actions__preview', 'alight-link-url-preview'],
      },
      children: [
        {
          text: this._urlText
        }
      ]
    });
  }

  /**
   * Creates a button view with the specified label and icon.
   * @param label The label for the button.
   * @param icon The icon for the button.
   * @returns The created ButtonView.
   */
  private _createButton(label: string, icon: string): ButtonView {
    const button = new ButtonView(this.locale);
    button.set({
      label,
      icon,
      tooltip: true
    });
    return button;
  }

  /**
   * Creates the URL preview view.
   * @returns The created URL preview View.
   */
  private _createURLPreview(): View {
    const view = new View(this.locale);
    view.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', '_createURLPreview', 'alight-link-url-preview'],
      },
      children: [
        {
          text: this._urlText
        }
      ]
    });
    return view;
  }
}

/**
 * A custom view to add additional content to the default LinkUI balloon.
 * You can customize this view to include any extra controls or information.
 */
class MyCustomContentView extends View {
  constructor(locale: any) {
    super(locale);
    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['my-custom-content']
      },
      children: [
        {
          tag: 'p',
          children: [
            {
              text: 'Additional custom content for the link balloon.'
            }
          ]
        }
      ]
    });
  }
}
