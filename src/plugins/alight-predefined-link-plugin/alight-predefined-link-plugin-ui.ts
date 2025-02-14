// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View, BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CKAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { createPublicLinkModalContent, validateForm } from './modal-content/predefind-link';
import type AlightPredefinedLinkPluginCommand from './alight-predefined-link-plugin-command';
import toolBarIcon from './assets/icon-link.svg';
import editIcon from './assets/icon-pencil.svg';
import unlinkIcon from './assets/icon-unlink.svg';
import './styles/alight-predefined-link-plugin.scss';

// The UI component of the public link plugin.
// Handles the toolbar button, modal dialog, and contextual balloon.
export default class AlightPredefinedLinkPluginUI extends Plugin {
  private _balloon?: ContextualBalloon; // Holds the reference to the contextual balloon instance
  private _actionsView?: ActionsView; // Holds the reference to the actions view displayed in the balloon
  private _modalDialog?: CKAlightModalDialog; // Holds the reference to the modal dialog
  private _storedRange: any = null; // Stores the selection range when losing focus

  // Plugin dependencies
  public static get requires() {
    return [ContextualBalloon];
  }

  // Plugin name
  public static get pluginName() {
    return 'AlightPredefinedLinkPluginUI' as const;
  }

  // Initializes the plugin
  public init(): void {
    const editor = this.editor;

    // Get the balloon plugin instance
    this._balloon = editor.plugins.get(ContextualBalloon);
    // Create actions view for the balloon
    this._actionsView = this._createActionsView();
    // Add click observer for handling link clicks
    editor.editing.view.addObserver(ClickObserver);

    // Setup toolbar button, click handling, and balloon handling
    this._setupToolbarButton();
    this._setupClickHandling();
    this._setupBalloonHandling();
  }

  // Sets up the toolbar button for inserting a public link
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    // Add toolbar button
    editor.ui.componentFactory.add('alightPredefinedLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightPredefinedLinkPlugin');

      if (!command) {
        console.warn('AlightPredefinedLinkPlugin command not found');
        return button;
      }

      button.set({
        label: t('Insert predefined link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Bind button state to command state
      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);

      // Handle button click to show the modal
      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  // Sets up click handling for detecting and interacting with links
  private _setupClickHandling(): void {
    const editor = this.editor;

    // Handle clicks in the editor
    this.listenTo(editor.editing.view.document, 'click', (evt, data) => {
      const domEvent = data.domEvent as MouseEvent;
      const domElement = domEvent.target as HTMLElement;

      // Check if the clicked element is a link
      if (domElement.tagName === 'A') {
        evt.stop();
        data.preventDefault();

        // Convert DOM element to CKEditor view element
        const viewElement = editor.editing.view.domConverter.domToView(domElement);
        if (viewElement && viewElement.is('element')) {
          const modelElement = editor.editing.mapper.toModelElement(viewElement);
          if (modelElement) {
            // Set selection on the clicked link
            editor.model.change(writer => {
              writer.setSelection(writer.createRangeOn(modelElement));
            });
            this._showBalloon();
          }
        }
      }
    });

    // Hide the balloon when editor loses focus
    this.listenTo(editor.ui.focusTracker, 'change:isFocused', (evt, name, isFocused) => {
      if (!isFocused) {
        const selection = editor.model.document.selection;
        const range = selection.getFirstRange();
        if (range) {
          this._storedRange = range;
        }
        this._hideBalloon();
      }
    });
  }

  // Sets up balloon handling for showing the link actions
  private _setupBalloonHandling(): void {
    const editor = this.editor;

    // Show balloon on selection change if link is selected
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      const command = editor.commands.get('alightPredefinedLinkPlugin');
      if (command?.value) {
        this._showBalloon();
      } else {
        this._hideBalloon();
      }
    });
  }

  // Creates the actions view displayed in the balloon
  private _createActionsView(): ActionsView {
    const editor = this.editor;
    const actionsView = new ActionsView(editor.locale);
    const command = editor.commands.get('alightPredefinedLinkPlugin') as AlightPredefinedLinkPluginCommand;

    // Handle edit button click
    actionsView.editButtonView.on('execute', () => {
      this._hideBalloon();
      this._showModal(command.value);
    });

    // Handle unlink button click
    actionsView.unlinkButtonView.on('execute', () => {
      editor.execute('alightPredefinedLinkPlugin');
      this._hideBalloon();
    });

    return actionsView;
  }

  // Shows the balloon with link actions
  private _showBalloon(): void {
    if (!this._balloon || !this._actionsView) return;

    const command = this.editor.commands.get('alightPredefinedLinkPlugin') as AlightPredefinedLinkPluginCommand;
    const linkUrl = command.value?.url || '';

    // Update URL display in balloon
    this._actionsView.updateLinkDisplay(linkUrl);

    const positions = BalloonPanelView.defaultPositions;
    const selection = this.editor.model.document.selection;
    const range = selection.getFirstRange();

    if (!range) return;

    // Convert model position to view position for balloon placement
    const viewRange = this.editor.editing.mapper.toViewRange(range);
    const domRange = this.editor.editing.view.domConverter.viewRangeToDom(viewRange);

    if (!domRange) return;

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

  // Hides the balloon
  private _hideBalloon(): void {
    if (this._balloon && this._actionsView && this._balloon.hasView(this._actionsView)) {
      this._balloon.remove(this._actionsView);
    }
  }

  private _showModal(initialValue?: { url: string; orgName?: string }): void {
    const editor = this.editor;
    const command = editor.commands.get('alightPredefinedLinkPlugin') as AlightPredefinedLinkPluginCommand;

    const initialUrl = initialValue?.url || '';
    const initialOrgName = initialValue?.orgName || '';

    if (!this._modalDialog) {
      this._modalDialog = new CKAlightModalDialog({
        title: 'Predefined Link',
        modal: true,
        width: '500px',
        height: 'auto',
        closeOnEscape: true,
        closeOnClickOutside: true,
        contentClass: 'predefined-link-content',
        buttons: [
          {
            label: 'Cancel',
            variant: 'outlined',
            position: 'left',
            shape: 'round'
          },
          {
            label: 'Continue',
            variant: 'default',
            position: 'right',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false
          }
        ]
      });

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#predefined-link-form') as HTMLFormElement;
          const isValid = validateForm(form);

          if (isValid) {
            const urlInput = form?.querySelector('#link-url') as HTMLInputElement;
            const orgNameInput = form?.querySelector('#org-name') as HTMLInputElement;

            command.execute({
              url: urlInput.value,
              orgName: orgNameInput?.value || undefined
            });
            this._modalDialog?.hide(); // Only close if validation passes
          }
          // If validation fails, modal stays open
        }
      });
    }

    // Set modal content and show it
    const content = createPublicLinkModalContent(initialUrl, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  // Destroys the plugin
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
    this._actionsView?.destroy();
  }
}

// The view displayed in the balloon
class ActionsView extends View {
  public readonly editButtonView: ButtonView; // Button for editing the link
  public readonly unlinkButtonView: ButtonView; // Button for unlinking the link
  public readonly linkURLView: View; // View displaying the link URL
  private _urlText: string = ''; // Stores the displayed URL text

  constructor(locale: any) {
    super(locale);

    // Initialize buttons and URL preview
    this.editButtonView = this._createButton('Edit link', editIcon);
    this.unlinkButtonView = this._createButton('Unlink', unlinkIcon);
    this.linkURLView = this._createURLPreview();

    // Set the template for the actions view container
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

  // Updates the URL display in the balloon
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

  // Creates a button view with an icon and label
  private _createButton(label: string, icon: string): ButtonView {
    const button = new ButtonView(this.locale);

    button.set({
      label,
      icon,
      tooltip: true
    });

    return button;
  }

  // Creates the URL preview view
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
