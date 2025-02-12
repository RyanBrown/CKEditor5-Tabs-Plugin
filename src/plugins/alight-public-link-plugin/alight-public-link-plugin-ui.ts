// src/plugins/alight-public-link-plugin/alight-public-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  ButtonView,
  ContextualBalloon,
  View,
  BalloonPanelView
} from '@ckeditor/ckeditor5-ui';
import { LinkUI } from '@ckeditor/ckeditor5-link';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import { CKAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { createPublicLinkModalContent } from './modal-content/public-website';
import type AlightPublicLinkCommand from './alight-public-link-plugin-command';
import toolBarIcon from './assets/icon-link.svg';
import './styles/alight-public-link-plugin.scss';
import { getSelectedLinkElement } from './alight-public-link-plugin-utils';


// The UI component of the public link plugin.
// Handles the toolbar button, modal dialog, and contextual balloon.
///
export default class AlightPublicLinkUI extends Plugin {
  // Reference to the modal dialog instance
  private _modalDialog?: CKAlightModalDialog;
  // Reference to the contextual balloon plugin instance
  private _balloon?: ContextualBalloon;
  // Reference to the actions view displayed in the balloon
  private _actionsView?: ActionsView;

  // Plugin dependencies
  public static get requires() {
    return [LinkUI, ContextualBalloon];
  }

  // Plugin name
  public static get pluginName() {
    return 'AlightPublicLinkUI' as const;
  }

  // Initializes the plugin
  public init(): void {
    const editor = this.editor;

    // Get the balloon plugin instance
    this._balloon = editor.plugins.get(ContextualBalloon);
    // Create the actions view for the balloon
    this._actionsView = this._createActionsView();
    // Add click observer to the editing view
    editor.editing.view.addObserver(ClickObserver);

    this._setupToolbarButton();
    this._setupClickHandling();
    this._handleBalloonEditing();
  }

  // Sets up the toolbar button
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    // Add toolbar button
    editor.ui.componentFactory.add('alightPublicLinkPlugin', locale => {
      const button = new ButtonView(locale);
      const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

      button.set({
        label: t('Insert public link'),
        icon: toolBarIcon,
        tooltip: true,
        withText: true,
      });

      // Bind button state to command state
      button.bind('isEnabled').to(command);
      button.bind('isOn').to(command, 'value', value => !!value);

      // Handle button click
      this.listenTo(button, 'execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  // Sets up click handling for links
  private _setupClickHandling(): void {
    const editor = this.editor;

    // Handle clicks in the editor
    this.listenTo(editor.editing.view.document, 'click', () => {
      const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;
      const selectedElement = getSelectedLinkElement(editor);

      if (selectedElement) {
        this._showBalloon(selectedElement);
      } else {
        this._hideBalloon();
      }
    });

    // Handle editor focus changes
    this.listenTo(editor.ui, 'update', () => {
      if (!editor.ui.focusTracker.isFocused) {
        this._hideBalloon();
      }
    });
  }

  // Creates the actions view displayed in the balloon
  private _createActionsView(): ActionsView {
    const editor = this.editor;
    const actionsView = new ActionsView(editor.locale);
    const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

    // Handle edit button click
    actionsView.editButtonView.on('execute', () => {
      this._hideBalloon();
      this._showModal(command.value);
    });

    // Handle unlink button click
    actionsView.unlinkButtonView.on('execute', () => {
      editor.execute('alightPublicLinkPlugin');
      this._hideBalloon();
    });

    return actionsView;
  }


  // Shows the balloon with link actions

  private _showBalloon(targetElement: any): void {
    if (!this._balloon || !this._actionsView) return;

    const command = this.editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

    // Update the URL display in the balloon
    this._actionsView.updateLinkDisplay(command.value || '');

    if (this._balloon.hasView(this._actionsView)) {
      // If the balloon is already visible, just update its position
      this._balloon.updatePosition(this._getBalloonPositionData(targetElement));
    } else {
      // Add the view to the balloon
      this._balloon.add({
        view: this._actionsView,
        position: this._getBalloonPositionData(targetElement)
      });
    }
  }


  // Hides the balloon

  private _hideBalloon(): void {
    if (this._balloon && this._actionsView && this._balloon.hasView(this._actionsView)) {
      this._balloon.remove(this._actionsView);
    }
  }

  // Gets the balloon position data
  private _getBalloonPositionData(targetElement: any) {
    const editor = this.editor;
    const positions = BalloonPanelView.defaultPositions;

    return {
      target: editor.editing.view.domConverter.mapViewToDom(targetElement),
      positions: Array.isArray(positions) ? positions : Object.values(positions)
    };
  }

  // Shows the modal dialog for link editing
  // Update the modal button click handler in _showModal method
  private _showModal(initialValue?: string): void {
    const editor = this.editor;
    const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;

    // Get initial values
    const currentLink = command.value;
    const initialUrl = currentLink?.url || initialValue || '';
    const initialOrgName = currentLink?.orgName || '';

    if (!this._modalDialog) {
      this._modalDialog = new CKAlightModalDialog({
        title: 'Link to a Public Link',
        modal: true,
        width: '500px',
        height: 'auto',
        closeOnEscape: true,
        closeOnClickOutside: true,
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
            shape: 'round'
          }
        ]
      });

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Continue') {
          const form = this._modalDialog?.element?.querySelector('#public-link-form') as HTMLFormElement;
          const urlInput = form?.querySelector('#link-url') as HTMLInputElement;
          const orgNameInput = form?.querySelector('#org-name') as HTMLInputElement;

          if (urlInput && urlInput.value) {
            const linkData = {
              url: urlInput.value,
              orgName: orgNameInput?.value || undefined
            };
            command.execute(linkData);
          }
        }
      });
    }

    // Set modal content and show it
    const content = createPublicLinkModalContent(initialUrl, initialOrgName);
    this._modalDialog.setContent(content);
    this._modalDialog.show();
  }

  // Handles balloon editing integration
  private _handleBalloonEditing(): void {
    const editor = this.editor;
    const linkUI = editor.plugins.get(LinkUI);

    // Override the actionsView's edit button click handler
    this.listenTo(linkUI, 'edit', (evt, data) => {
      evt.stop();
      const command = editor.commands.get('alightPublicLinkPlugin') as AlightPublicLinkCommand;
      this._showModal(command.value);
    });
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
  public readonly editButtonView: ButtonView;
  public readonly unlinkButtonView: ButtonView;
  public readonly linkURLView: View;
  private _urlText: string = '';

  constructor(locale: any) {
    super(locale);

    this.editButtonView = this._createButton('Edit link', '📝');
    this.unlinkButtonView = this._createButton('Unlink', '🔗');
    this.linkURLView = this._createURLPreview();

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'alight-link-actions'],
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
        class: ['ck', 'alight-link-url-preview'],
      },
      children: [
        {
          text: this._urlText
        }
      ]
    });
  }

  // Creates a button view
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
        class: ['ck', 'alight-link-url-preview'],
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