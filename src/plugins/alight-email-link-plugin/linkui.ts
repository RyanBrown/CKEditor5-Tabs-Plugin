// src/plugins/alight-email-link-plugin/linkui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  ClickObserver,
  type ViewAttributeElement,
  type ViewDocumentClickEvent
} from '@ckeditor/ckeditor5-engine';
import {
  ButtonView,
  ContextualBalloon,
  MenuBarMenuListItemButtonView,
  clickOutsideHandler
} from '@ckeditor/ckeditor5-ui';
import { isWidget } from '@ckeditor/ckeditor5-widget';

import AlightEmailLinkPluginEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightEmailLinkPluginCommand from './linkcommand';
import type AlightEmailUnlinkCommand from './unlinkcommand';
import { isLinkElement } from './utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

// Use a unique marker name to avoid conflicts with standard link plugin
const VISUAL_SELECTION_MARKER_NAME = 'alight-email-link-ui';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * The link UI plugin. It introduces the `'alight-email-link'` and `'alight-email-unlink'` buttons.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightEmailLinkPluginUI extends Plugin {
  /**
   * The modal dialog instance.
   */
  private _modalDialog: CkAlightModalDialog | null = null;

  /**
   * The actions view displayed inside of the balloon.
   */
  public actionsView: LinkActionsView | null = null;

  /**
   * The contextual balloon plugin instance.
   */
  private _balloon!: ContextualBalloon;

  /**
   * Track if we are currently updating the UI to prevent recursive calls
   */
  private _isUpdatingUI: boolean = false;

  /**
   * Tracks whether we're editing an existing link (true) or creating a new one (false)
   */
  private _isEditing: boolean = false;

  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightEmailLinkPluginEditing, ContextualBalloon] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLinkPluginUI' as const;
  }

  /**
   * @inheritDoc
   */
  public static override get isOfficialPlugin(): true {
    return true;
  }

  /**
   * @inheritDoc
   */
  public init(): void {
    const editor = this.editor;
    const t = this.editor.t;

    editor.editing.view.addObserver(ClickObserver);
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Create the actions view for the balloon
    this.actionsView = this._createActionsView();

    // Create toolbar buttons.
    this._createToolbarLinkButton();
    this._enableUIActivators();

    // Renders a fake visual selection marker on an expanded selection.
    editor.conversion.for('editingDowncast').markerToHighlight({
      model: VISUAL_SELECTION_MARKER_NAME,
      view: {
        classes: ['ck-fake-alight-email-link-selection']
      }
    });

    // Renders a fake visual selection marker on a collapsed selection.
    editor.conversion.for('editingDowncast').markerToElement({
      model: VISUAL_SELECTION_MARKER_NAME,
      view: (data, { writer }) => {
        if (!data.markerRange.isCollapsed) {
          return null;
        }

        const markerElement = writer.createUIElement('span');

        writer.addClass(
          ['ck-fake-alight-email-link-selection', 'ck-fake-alight-email-link-selection_collapsed'],
          markerElement
        );

        return markerElement;
      }
    });

    // Listen to selection changes to ensure UI state is updated
    this.listenTo(editor.model.document, 'change:data', () => {
      // Force refresh the command on selection changes
      const linkCommand = editor.commands.get('alight-email-link');
      if (linkCommand) {
        linkCommand.refresh();
      }
    });

    // Enable balloon-modal interactions
    this._enableBalloonInteractions();

    // Add the information about the keystrokes to the accessibility database
    editor.accessibility.addKeystrokeInfos({
      keystrokes: [
        {
          label: t('Move out of an email link'),
          keystroke: [
            ['arrowleft', 'arrowleft'],
            ['arrowright', 'arrowright']
          ]
        }
      ]
    });

    // Register the UI component
    editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
      return this.createButtonView(locale);
    });
  }

  /**
   * @inheritDoc
   */
  public override destroy(): void {
    super.destroy();

    // Destroy created UI components
    if (this._modalDialog) {
      this._modalDialog.destroy();
      this._modalDialog = null;
    }

    if (this.actionsView) {
      this.actionsView.destroy();
    }
  }

  /**
   * Creates a button view for the plugin
   */
  public createButtonView(locale: any): ButtonView {
    return this._createButton(ButtonView);
  }

  /**
   * Creates a toolbar AlightEmailLinkPlugin button. Clicking this button will show the modal dialog.
   */
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightEmailLinkPlugin', () => {
      const button = this._createButton(MenuBarMenuListItemButtonView);

      button.set({
        role: 'menuitemcheckbox'
      });

      return button;
    });
  }

  /**
   * Creates a button for link command to use either in toolbar or in menu bar.
   */
  private _createButton<T extends typeof ButtonView>(ButtonClass: T): InstanceType<T> {
    const editor = this.editor;
    const locale = editor.locale;
    const command = editor.commands.get('alight-email-link')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    view.set({
      class: 'ck-alight-email-link-button',
      icon: ToolBarIcon,
      isToggleable: true,
      label: t('Email link'),
      withText: true,
    });

    view.bind('isEnabled').to(command, 'isEnabled');
    view.bind('isOn').to(command, 'value', value => !!value);

    // Listen to selection changes to update button state
    this.listenTo(editor.model.document, 'change:data', () => {
      view.set('isEnabled', this._shouldEnableButton());
    });

    // Show the modal dialog on button click for creating new links
    this.listenTo(view, 'execute', () => this._showUI());

    return view;
  }

  /**
   * Determines whether the button should be enabled based on selection state
   * @returns True if the button should be enabled, false otherwise
   */
  private _shouldEnableButton(): boolean {
    const editor = this.editor;
    const command = editor.commands.get('alight-email-link')!;
    const selection = editor.model.document.selection;

    // If the command itself is disabled, button should be disabled too
    if (!command.isEnabled) {
      return false;
    }

    // Enable if text is selected (not collapsed) or cursor is in an existing link
    const hasSelection = !selection.isCollapsed;
    const isInLink = selection.hasAttribute('alightEmailLinkPluginHref');

    return hasSelection || isInLink;
  }

  /**
   * Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
   */
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-email-unlink') as AlightEmailUnlinkCommand;

    // This is the key binding - ensure it's correctly bound to the command's value
    actionsView.bind('href').to(linkCommand, 'value');

    actionsView.editButtonView.bind('isEnabled').to(linkCommand);
    actionsView.unlinkButtonView.bind('isEnabled').to(unlinkCommand);

    // Execute editing in a modal dialog after clicking the "Edit" button
    this.listenTo(actionsView, 'edit', () => {
      this._hideUI();
      this._showUI(true);
    });

    // Execute unlink command after clicking on the "Unlink" button
    this.listenTo(actionsView, 'unlink', () => {
      editor.execute('alight-email-unlink');
      this._hideUI();
    });

    // Close the balloon on Esc key press
    actionsView.keystrokes.set('Esc', (data, cancel) => {
      this._hideUI();
      cancel();
    });

    return actionsView;
  }

  /**
   * Public method to show UI - needed for compatibility with linkimageui.ts
   * 
   * @param isEditing Whether we're editing an existing link
   */
  public showUI(isEditing: boolean = false): void {
    this._showUI(isEditing);
  }

  /**
   * Attaches actions that control whether the modal dialog should be displayed.
   */
  private _enableUIActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    // Handle click on view document to show balloon
    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', () => {
      const selectedLink = this._getSelectedLinkElement();

      // Only handle our custom email links, not standard links
      if (selectedLink && selectedLink.hasAttribute('href')) {
        const href = selectedLink.getAttribute('href');
        if (typeof href === 'string' && href.startsWith('mailto:')) {
          // Show balloon with actions (edit/unlink) when clicking on a link
          this._showBalloon();
        }
      }
    });
  }

  /**
   * Enable interactions between the balloon and modal interface.
   */
  private _enableBalloonInteractions(): void {
    // Skip if actionsView is not initialized yet
    if (!this.actionsView) {
      return;
    }

    // Allow clicking outside the balloon to close it
    clickOutsideHandler({
      emitter: this.actionsView,
      activator: () => this._areActionsInPanel,
      contextElements: () => [this._balloon.view.element!],
      callback: () => this._hideUI()
    });
  }

  /**
   * Shows balloon with link actions.
   */
  private _showBalloon(): void {
    if (this.actionsView && this._balloon && !this._balloon.hasView(this.actionsView)) {
      this._balloon.add({
        view: this.actionsView,
        position: this._getBalloonPositionData()
      });

      // Begin responding to UI updates
      this._startUpdatingUI();
    }
  }

  /**
   * Returns positioning options for the balloon.
   */
  private _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    let target = null;

    // Get the position based on selected link
    const targetLink = this._getSelectedLinkElement();

    if (targetLink) {
      target = view.domConverter.mapViewToDom(targetLink);
    } else {
      target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange()!);
    }

    return { target };
  }

  /**
   * Determines whether the balloon is visible in the editor.
   */
  private get _areActionsInPanel(): boolean {
    return !!this.actionsView && !!this._balloon && this._balloon.hasView(this.actionsView);
  }

  /**
   * Makes the UI respond to editor document changes.
   */
  private _startUpdatingUI(): void {
    if (this._isUpdatingUI) {
      return;
    }

    const editor = this.editor;
    let prevSelectedLink = this._getSelectedLinkElement();

    const update = () => {
      // Prevent recursive updates
      if (this._isUpdatingUI) {
        return;
      }

      this._isUpdatingUI = true;

      try {
        const selectedLink = this._getSelectedLinkElement();

        // Hide the panel if the selection moved out of the link element
        if (prevSelectedLink && !selectedLink) {
          this._hideUI();
        } else if (this._areActionsInPanel) {
          // Update the balloon position as the selection changes
          this._balloon.updatePosition(this._getBalloonPositionData());
        }

        prevSelectedLink = selectedLink;
      } finally {
        this._isUpdatingUI = false;
      }
    };

    this.listenTo(editor.ui, 'update', update);

    // Only listen to balloon changes if we have a balloon
    if (this._balloon) {
      this.listenTo(this._balloon, 'change:visibleView', update);
    }
  }

  /**
   * Shows the modal dialog for link editing.
   */
  private _showUI(isEditing: boolean = false): void {
    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand;
    const selectedLink = this._getSelectedLinkElement();

    // Store edit mode state
    this._isEditing = isEditing;

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: t('Create email link'),
        width: '32rem',
        contentClass: 'cka-email-link-content',
        buttons: [
          { label: t('Cancel') },
          { label: t('Continue'), isPrimary: true, closeOnClick: false, disabled: true }
        ]
      });

      // Handle button clicks via the buttonClick event
      this._modalDialog.on('buttonClick', (data: { button: string; }) => {
        if (data.button === t('Continue')) {
          const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
          const organizationInput = document.getElementById('ck-organization-input') as HTMLInputElement;

          if (!emailInput || !organizationInput) {
            return;
          }

          const email = emailInput.value.trim();
          const organization = organizationInput.value.trim();

          // Clear any previous error messages and invalid class
          const errorElement = document.getElementById('ck-email-error');
          if (errorElement) {
            errorElement.style.display = 'none';
          }

          emailInput.classList.remove('invalid');

          // Validate email
          if (!this._validateEmail(email)) {
            // Show error message
            if (errorElement) {
              errorElement.textContent = email.trim() === '' ?
                t('Email address is required') :
                t('Please enter a valid email address');
              errorElement.style.display = 'block';
            }
            // Add invalid class to email input
            emailInput.classList.add('invalid');
            emailInput.focus();
            return;
          }

          // Build proper mailto link
          let emailLink = email;
          if (!emailLink.startsWith('mailto:')) {
            emailLink = 'mailto:' + emailLink;
          }

          // If we get here, the URL is valid, so execute the command
          editor.execute('alight-email-link', emailLink, { organization });

          // Close the modal
          if (this._modalDialog) {
            this._modalDialog.hide();
          }
        } else if (data.button === t('Cancel')) {
          if (this._modalDialog) {
            this._modalDialog.hide();
          }
        }
      });

      // Add event listener for when the modal is closed
      this._modalDialog.on('close', () => {
        // Reset edit mode when modal is closed
        this._isEditing = false;
      });
    }

    // Update modal title based on whether we're editing or creating
    if (this._modalDialog) {
      this._modalDialog.setTitle(isEditing ? t('Edit email link') : t('Create email link'));

      // Prepare the form HTML
      const formHTML = this._createFormHTML(t, isEditing);
      this._modalDialog.setContent(formHTML);

      // Show the modal
      this._modalDialog.show();

      // Set values if we're editing
      if (isEditing && linkCommand.value) {
        setTimeout(() => {
          const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
          const organizationInput = document.getElementById('ck-organization-input') as HTMLInputElement;

          if (!emailInput || !organizationInput) {
            return;
          }

          let email = linkCommand.value || '';
          if (email.startsWith('mailto:')) {
            email = email.substring(7); // Remove mailto: prefix
          }

          emailInput.value = email;

          // First try to get organization from the command
          if (linkCommand.organization !== undefined) {
            organizationInput.value = linkCommand.organization;
          }

          // Update continue button state
          this._updateContinueButtonState();
        }, 50);
      }

      // Focus the email input and setup listeners
      setTimeout(() => {
        const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
        if (emailInput) {
          emailInput.focus();

          // Add event listener to the email input to enable/disable the continue button
          // Use input event for real-time feedback as user types or pastes
          emailInput.addEventListener('input', () => {
            this._updateContinueButtonState();
          });

          // Also listen for blur to catch any edge cases
          emailInput.addEventListener('blur', () => {
            this._updateContinueButtonState();
          });

          // Initial state - continue button should be disabled if email is empty
          this._updateContinueButtonState();
        }
      }, 100);
    }
  }

  /**
   * Updates the state of the continue button based on email input value
   */
  private _updateContinueButtonState(): void {
    if (!this._modalDialog) {
      return;
    }

    const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
    if (!emailInput) {
      return;
    }

    // Check if the email input has any value (enabling) or is empty (disabling)
    const hasValue = emailInput.value.trim().length > 0;

    // Find the continue button directly in the DOM
    const continueButton = this._modalDialog.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;

    if (continueButton) {
      // Update the disabled property
      continueButton.disabled = !hasValue;

      // Update classes for visual indication
      if (hasValue) {
        continueButton.removeAttribute('disabled');
      } else {
        continueButton.setAttribute('disabled', 'disabled');
      }
    }
  }

  /**
   * Hides the UI
   */
  private _hideUI(): void {
    // Prevent recursive calls
    if (this._isUpdatingUI) {
      return;
    }

    this._isUpdatingUI = true;

    try {
      // Reset edit mode state
      this._isEditing = false;

      // Hide the balloon if it's showing
      if (this.actionsView && this._balloon && this._balloon.hasView(this.actionsView)) {
        this._balloon.remove(this.actionsView);
        this.stopListening(this.editor.ui, 'update');
        if (this._balloon) {
          this.stopListening(this._balloon, 'change:visibleView');
        }
      }

      // Hide the modal if it's showing
      if (this._modalDialog && this._modalDialog.isVisible) {
        this._modalDialog.hide();
      }
    } catch (error) {
      console.error('Error hiding UI:', error);
    } finally {
      this._isUpdatingUI = false;
    }
  }

  /**
   * Creates the HTML for the form inside the modal.
   */
  private _createFormHTML(t: Function, isEditing: boolean): string {
    return `
      <div class="cka-form-container">
        <div class="cka-form-group">
          <label for="ck-email-input" class="cka-input-label">${t('Email address')}</label>
          <input id="ck-email-input" type="email" class="cka-input-text cka-width-100" placeholder="${t('user@example.com')}" required/>
          <div id="ck-email-error" class="cka-error-message" style="display:none;"></div>
          </div>
          <div class="cka-form-group mt-4">
            <label for="ck-organization-input" class="cka-input-label">${t('Organization name (optional)')}</label>
            <input id="ck-organization-input" type="text" class="cka-input-text cka-width-100" placeholder="${t('Organization name')}"/>
            <div class="cka-note-text mt-1">${t('Specify the third-party organization to inform users about the destination of the link.')}</div>
        </div>
      </div>
    `;
  }

  /**
   * Validates an email address.
   */
  private _validateEmail(email: string): boolean {
    // Check that email is not empty
    if (!email || email.trim() === '') {
      return false;
    }

    // If it starts with mailto:, validate the part after
    if (email.startsWith('mailto:')) {
      return EMAIL_REGEX.test(email.substring(7));
    }

    // Otherwise validate the entire string
    return EMAIL_REGEX.test(email);
  }

  /**
   * Returns the link element under the editing view's selection or `null`
   * if there is none.
   */
  private _getSelectedLinkElement(): ViewAttributeElement | null {
    const view = this.editor.editing.view;
    const selection = view.document.selection;
    const selectedElement = selection.getSelectedElement();

    // The selection is collapsed or some widget is selected (especially inline widget).
    if (selection.isCollapsed || (selectedElement && isWidget(selectedElement))) {
      return findLinkElementAncestor(selection.getFirstPosition()!);
    } else {
      // The range for fully selected link is usually anchored in adjacent text nodes.
      // Trim it to get closer to the actual link element.
      const range = selection.getFirstRange()!.getTrimmed();
      const startLink = findLinkElementAncestor(range.start);
      const endLink = findLinkElementAncestor(range.end);

      if (!startLink || startLink != endLink) {
        return null;
      }

      // Check if the link element is fully selected.
      if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
        return startLink;
      } else {
        return null;
      }
    }
  }
}

/**
 * Returns a link element if there's one among the ancestors of the provided `Position`.
 */
function findLinkElementAncestor(position: any): ViewAttributeElement | null {
  const linkElement = position.getAncestors().find((ancestor: any) => isLinkElement(ancestor));
  return linkElement && linkElement.is('attributeElement') ? linkElement : null;
}
