// src/plugins/alight-email-link-plugin/alight-email-link-plugin-plugin-ui.ts

// Import necessary classes and components from CKEditor5.
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';
import type AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import toolBarIcon from './assets/icon-link.svg';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';
import './styles/alight-email-link-plugin.scss';

// The UI component of the email link plugin.
// Handles the toolbar button, modal dialog, and contextual balloon.
export default class AlightEmailLinkPluginUI extends Plugin {
  // Holds the reference to the contextual balloon instance.
  private _balloon?: ContextualBalloon;
  // Holds the reference to the actions view displayed in the balloon.
  private _actionsView?: ActionsView;
  // Holds the reference to the modal dialog.
  private _modalDialog?: CkAlightModalDialog;

  // Specifies the required plugins.
  public static get requires() {
    // console.log('[AlightEmailLinkPluginUI] Getting required plugins.');
    return [ContextualBalloon];
  }

  // Returns the plugin name.
  public static get pluginName() {
    // console.log('[AlightEmailLinkPluginUI] Retrieving plugin name.');
    return 'AlightEmailLinkPluginUI' as const;
  }

  // Initializes the plugin by setting up schema, converters, commands, toolbar button,
  // click handling, and balloon handling.
  public init(): void {
    const editor = this.editor;
    // console.log('[AlightEmailLinkPluginUI] Initializing plugin UI.');

    // Get the balloon plugin instance.
    this._balloon = editor.plugins.get(ContextualBalloon);
    // console.log('[AlightEmailLinkPluginUI] Retrieved ContextualBalloon instance:', this._balloon);
    // Create the actions view for the balloon.
    this._actionsView = this._createActionsView();
    // console.log('[AlightEmailLinkPluginUI] Created actions view:', this._actionsView);
    // Add click observer for handling link clicks.
    editor.editing.view.addObserver(ClickObserver);
    // console.log('[AlightEmailLinkPluginUI] ClickObserver added to the editing view.');

    // Setup the toolbar button, click handling, and balloon handling.
    this._setupToolbarButton();
    this._setupClickHandling();
    this._setupBalloonHandling();
    // console.log('[AlightEmailLinkPluginUI] Plugin UI initialization completed.');
  }

  // Sets up the toolbar button for inserting or editing an email link.
  private _setupToolbarButton(): void {
    // console.log('[AlightEmailLinkPluginUI] Setting up toolbar button.');
    const editor = this.editor;
    const t = editor.t;

    // Add the toolbar button to the component factory.
    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      // console.log('[AlightEmailLinkPluginUI] Creating toolbar button for email link.');
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightEmailLinkPlugin');

      if (!command) {
        console.warn('[AlightEmailLinkPluginUI] AlightEmailLinkPlugin command not found.');
        return button;
      }

      // Configure the button properties.
      button.set({
        label: t('Email Link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });
      // console.log('[AlightEmailLinkPluginUI] Toolbar button configured:', button);

      // Bind button state to command state.
      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);
      // console.log('[AlightEmailLinkPluginUI] Button state bound to command state.');

      // Handle button click to show the modal dialog.
      button.on('execute', () => {
        // console.log('[AlightEmailLinkPluginUI] Toolbar button clicked. Showing modal dialog.');
        this._showModal();
      });

      return button;
    });
  }

  // Sets up click handling for detecting and interacting with links in the editor.
  private _setupClickHandling(): void {
    // console.log('[AlightEmailLinkPluginUI] Setting up click handling.');
    const editor = this.editor;

    // Listen for clicks in the editor view.
    this.listenTo(editor.editing.view.document, 'click', (evt, data) => {
      // console.log('[AlightEmailLinkPluginUI] Editor view click detected.', data);
      const domEvent = data.domEvent as MouseEvent;
      const domElement = domEvent.target as HTMLElement;

      // Check if the clicked element is an anchor tag.
      if (domElement.tagName === 'A') {
        // console.log('[AlightEmailLinkPluginUI] Link (<a>) element clicked.', domElement);
        evt.stop();
        data.preventDefault();

        // Convert the DOM element to a CKEditor view element.
        const viewElement = editor.editing.view.domConverter.domToView(domElement);
        // console.log('[AlightEmailLinkPluginUI] Converted DOM element to view element:', viewElement);
        if (viewElement && viewElement.is('element')) {
          const modelElement = editor.editing.mapper.toModelElement(viewElement);
          // console.log('[AlightEmailLinkPluginUI] Mapped view element to model element:', modelElement);
          if (modelElement) {
            // Set selection on the clicked link in the model.
            editor.model.change(writer => {
              writer.setSelection(writer.createRangeOn(modelElement));
              // console.log('[AlightEmailLinkPluginUI] Model selection set on clicked link.');
            });
            this._updateBalloonVisibility();
          }
        }
      }
    });

    // Listen for focus changes to update balloon visibility.
    this.listenTo(editor.ui.focusTracker, 'change:isFocused', () => {
      console.log('[AlightEmailLinkPluginUI] Focus changed. Updating balloon visibility.');
      this._updateBalloonVisibility();
    });
  }

  // Sets up balloon handling for showing link actions when a link is selected.
  private _setupBalloonHandling(): void {
    // console.log('[AlightEmailLinkPluginUI] Setting up balloon handling.');
    const editor = this.editor;

    // Listen for changes in the model selection.
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      console.log('[AlightEmailLinkPluginUI] Selection range changed. Updating balloon visibility.');
      this._updateBalloonVisibility();
    });
  }

  // Consolidated function to update the balloon's visibility based on focus and selection.
  private _updateBalloonVisibility(): void {
    const editor = this.editor;
    const command = editor.commands.get('alightEmailLinkPlugin');
    const hasFocus = editor.ui.focusTracker.isFocused;
    const hasLinkSelected = !!command?.value;

    console.log('[AlightEmailLinkPluginUI] _updateBalloonVisibility: hasFocus =', hasFocus, ', hasLinkSelected =', hasLinkSelected);

    if (hasFocus && hasLinkSelected) {
      this._showBalloon();
    } else {
      this._hideBalloon();
    }
  }

  // Creates the actions view displayed in the balloon.
  // @returns The created ActionsView instance.
  private _createActionsView(): ActionsView {
    // console.log('[AlightEmailLinkPluginUI] Creating actions view for balloon.');
    const editor = this.editor;
    const actionsView = new ActionsView(editor.locale);
    const command = editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;

    // Handle edit button click to open the modal with current values.
    actionsView.editButtonView.on('execute', () => {
      // console.log('[AlightEmailLinkPluginUI] Edit button clicked. Hiding balloon and showing modal.');
      this._hideBalloon();
      this._showModal(command.value);
    });

    // Handle unlink button click to remove the link.
    actionsView.unlinkButtonView.on('execute', () => {
      // console.log('[AlightEmailLinkPluginUI] Unlink button clicked. Executing unlink command.');
      editor.execute('alightEmailLinkPlugin');
      this._hideBalloon();
    });

    return actionsView;
  }

  // Shows the balloon with link actions near the selected link.
  private _showBalloon(): void {
    // console.log('[AlightEmailLinkPluginUI] Attempting to show balloon.');
    if (!this._balloon || !this._actionsView) {
      console.warn('[AlightEmailLinkPluginUI] Balloon or actions view not available.');
      return;
    }

    const command = this.editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;
    const linkUrl = command.value?.email || '';
    // console.log('[AlightEmailLinkPluginUI] Link URL from command:', linkUrl);

    // Update URL display in the actions view.
    this._actionsView.updateLinkDisplay(linkUrl);

    const positions = BalloonPanelView.defaultPositions;
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range) {
      console.warn('[AlightEmailLinkPluginUI] No selection range found.');
      return;
    }

    // Convert the model range to a view range for balloon placement.
    const viewRange = this.editor.editing.mapper.toViewRange(range);
    const domRange = this.editor.editing.view.domConverter.viewRangeToDom(viewRange);
    // console.log('[AlightEmailLinkPluginUI] Converted model range to DOM range:', domRange);

    if (!domRange) {
      console.warn('[AlightEmailLinkPluginUI] DOM range conversion failed.');
      return;
    }

    // Update the balloon position if already visible, or add it if not.
    if (this._balloon.hasView(this._actionsView)) {
      // console.log('[AlightEmailLinkPluginUI] Updating balloon position.');
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
      // console.log('[AlightEmailLinkPluginUI] Adding balloon view.');
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

  // Hides the balloon if it is currently visible.
  private _hideBalloon(): void {
    // console.log('[AlightEmailLinkPluginUI] Hiding balloon if visible.');
    if (this._balloon && this._actionsView && this._balloon.hasView(this._actionsView)) {
      this._balloon.remove(this._actionsView);
      // console.log('[AlightEmailLinkPluginUI] Balloon removed.');
    }
  }

  // Shows the modal dialog for creating or editing an email link.
  // @param initialValue Optional initial values for the email link.
  public _showModal(initialValue?: { email: string; orgName?: string }): void {
    // console.log('[AlightEmailLinkPluginUI] Showing modal dialog with initial value:', initialValue);
    const editor = this.editor;
    const command = editor.commands.get('alightEmailLinkPlugin') as AlightEmailLinkPluginCommand;

    // Extract initial values or set defaults.
    const initialEmail = initialValue?.email || '';
    const initialOrgName = initialValue?.orgName || '';

    // If the modal dialog does not exist, create it.
    if (!this._modalDialog) {
      // console.log('[AlightEmailLinkPluginUI] Creating new modal dialog.');
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

      // Handle modal button clicks.
      this._modalDialog.on('buttonClick', (label: string) => {
        // console.log('[AlightEmailLinkPluginUI] Modal button clicked with label:', label);
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          // console.log('[AlightEmailLinkPluginUI] Modal dialog hidden on Cancel.');
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
          const isValid = validateForm(form);
          // console.log('[AlightEmailLinkPluginUI] Form validation result:', isValid);

          if (isValid) {
            const emailInput = form?.querySelector('#link-email') as HTMLInputElement;
            const orgNameInput = form?.querySelector('#org-name') as HTMLInputElement;
            // console.log('[AlightEmailLinkPluginUI] Form inputs retrieved:', emailInput.value, orgNameInput?.value);

            // Execute the command with the form values.
            command.execute({
              email: emailInput.value,
              orgName: orgNameInput?.value || undefined
            });
            // console.log('[AlightEmailLinkPluginUI] Command executed with new email link values.');
            this._modalDialog?.hide();
            // console.log('[AlightEmailLinkPluginUI] Modal dialog hidden after execution.');
          }
        }
      });
    }

    // Set modal content and display the modal dialog.
    const content = ContentManager(initialEmail, initialOrgName);
    // console.log('[AlightEmailLinkPluginUI] Setting modal content:', content);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
    // console.log('[AlightEmailLinkPluginUI] Modal dialog shown.');
  }

  // Destroys the plugin and cleans up resources.
  public override destroy(): void {
    // console.log('[AlightEmailLinkPluginUI] Destroying plugin UI.');
    super.destroy();
    this._modalDialog?.destroy();
    this._actionsView?.destroy();
    // console.log('[AlightEmailLinkPluginUI] Plugin UI destroyed.');
  }
}

// The view displayed in the balloon which provides actions
// such as editing or unlinking the email link.
class ActionsView extends View {
  // Button for editing the link.
  public readonly editButtonView: ButtonView;
  // Button for unlinking the link.
  public readonly unlinkButtonView: ButtonView;
  // View displaying the link URL.
  public readonly linkURLView: View;
  // Stores the displayed URL text.
  private _urlText: string = '';

  // Constructs the ActionsView.
  // @param locale The locale instance.
  constructor(locale: any) {
    super(locale);
    // console.log('[ActionsView] Initializing ActionsView.');

    // Initialize buttons and URL preview.
    this.editButtonView = this._createButton('Edit link', editIcon);
    // console.log('[ActionsView] Edit button created:', this.editButtonView);

    this.unlinkButtonView = this._createButton('Unlink', unlinkIcon);
    // console.log('[ActionsView] Unlink button created:', this.unlinkButtonView);

    this.linkURLView = this._createURLPreview();
    // console.log('[ActionsView] URL preview view created:', this.linkURLView);

    // Set the template for the actions view container.
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
    // console.log('[ActionsView] ActionsView template set.');
  }

  // Updates the URL display in the balloon.
  // @param url The URL to display.
  public updateLinkDisplay(url: string): void {
    // console.log('[ActionsView] Updating link display with URL:', url);
    this._urlText = url;
    // Update the template of the linkURLView with the new URL text.
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
    // console.log('[ActionsView] Link display updated.');
  }

  // Creates a button view with the specified label and icon.
  // @param label The label for the button.
  // @param icon The icon for the button.
  // @returns The created ButtonView.
  private _createButton(label: string, icon: string): ButtonView {
    const button = new ButtonView(this.locale);
    // console.log('[ActionsView] Creating button:', label);

    button.set({
      label,
      icon,
      tooltip: true
    });
    // console.log('[ActionsView] Button created with label and icon:', label, icon);

    return button;
  }

  // Creates the URL preview view.
  // @returns The created URL preview View.
  private _createURLPreview(): View {
    const view = new View(this.locale);
    // console.log('[ActionsView] Creating URL preview view.');

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
    // console.log('[ActionsView] URL preview view template set.');

    return view;
  }
}
