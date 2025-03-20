// src/plugins/alight-external-link-plugin/linkui.ts
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

import AlightExternalLinkPluginEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightExternalLinkPluginCommand from './linkcommand';
import type AlightExternalUnlinkCommand from './unlinkcommand';
import { addLinkProtocolIfApplicable, isLinkElement, isValidUrl } from './utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import type { CkAlightCheckbox } from './../ui-components/alight-checkbox-component/alight-checkbox-component';
import './../ui-components/alight-checkbox-component/alight-checkbox-component';

import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

// Use a unique marker name to avoid conflicts with standard link plugin
const VISUAL_SELECTION_MARKER_NAME = 'alight-external-link-ui';

/**
 * The link UI plugin. It introduces the `'alight-external-link'` and `'alight-external-unlink'` buttons.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightExternalLinkPluginUI extends Plugin {
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
   * @inheritDoc
   */
  public static get requires() {
    return [AlightExternalLinkPluginEditing, ContextualBalloon] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkPluginUI' as const;
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
        classes: ['ck-fake-alight-external-link-selection']
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
          ['ck-fake-alight-external-link-selection', 'ck-fake-alight-external-link-selection_collapsed'],
          markerElement
        );

        return markerElement;
      }
    });

    // Enable balloon-modal interactions
    this._enableBalloonInteractions();

    // Add the information about the keystrokes to the accessibility database
    editor.accessibility.addKeystrokeInfos({
      keystrokes: [
        {
          label: t('Move out of a link'),
          keystroke: [
            ['arrowleft', 'arrowleft'],
            ['arrowright', 'arrowright']
          ]
        }
      ]
    });

    // Register the UI component
    editor.ui.componentFactory.add('alightExternalLinkPlugin', locale => {
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
   * Creates a toolbar AlightExternalLinkPlugin button. Clicking this button will show the modal dialog.
   */
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightExternalLinkPlugin', () => {
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
    const command = editor.commands.get('alight-external-link')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    view.set({
      label: t('External Link'),
      icon: linkIcon,
      isToggleable: true,
      withText: true,
      // Add a custom class to differentiate from standard link button
      class: 'ck-alight-external-link-button'
    });

    view.bind('isEnabled').to(command, 'isEnabled');
    view.bind('isOn').to(command, 'value', value => !!value);

    // Show the modal dialog on button click for creating new links
    this.listenTo(view, 'execute', () => this._showUI());

    return view;
  }

  /**
   * Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
   */
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-external-unlink') as AlightExternalUnlinkCommand;

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
      editor.execute('alight-external-unlink');
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

      // Only handle our custom external links
      if (selectedLink && selectedLink.hasAttribute('href')) {
        const href = selectedLink.getAttribute('href');
        if (typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))) {
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
   * Validates a URL
   */
  private _validateURL(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }

    // Check if the URL contains a dot (required for a valid domain)
    if (!url.includes('.')) {
      return false;
    }

    // Only allow HTTP and HTTPS URLs
    // Check if it already has the protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(url);
    }

    // Otherwise validate without protocol (will be prefixed with http/https later)
    return /^(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i.test(url);
  }

  /**
   * Resets all form validations and errors
   * Called when the modal is opened
   */
  private _resetValidations(): void {
    setTimeout(() => {
      // Clear error message
      const errorElement = document.getElementById('cka-url-error');
      if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.textContent = '';
      }

      // Remove invalid class from input
      const prefixInputContainer = document.querySelector('.cka-prefix-input');
      if (prefixInputContainer) {
        prefixInputContainer.classList.remove('invalid');
      }

      // Reset URL input field (only if not in edit mode)
      if (!this._isEditing) {
        const urlInput = document.getElementById('cka-link-url-input') as HTMLInputElement;
        if (urlInput) {
          urlInput.value = '';
        }
      }

      // Make sure Continue button is disabled
      const continueButton = this._modalDialog?.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;
      if (continueButton) {
        continueButton.disabled = true;
        continueButton.setAttribute('disabled', 'disabled');
      }
    }, 10);
  }

  /**
   * Checks if the link element is an external link
   */
  private _isExternalLink(linkElement: ViewAttributeElement | null): boolean {
    if (!linkElement) return false;

    const href = linkElement.getAttribute('href');
    return typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'));
  }

  /**
   * Shows the modal dialog for link editing.
   */
  private _isEditing: boolean = false;

  /**
   * Shows the modal dialog for link editing.
   */
  private _showUI(isEditing: boolean = false): void {
    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;
    const selectedLink = this._getSelectedLinkElement();

    // Store edit mode state
    this._isEditing = isEditing;

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: t('Create External Link'),
        width: '32rem',
        contentClass: 'cka-external-link-content',
        buttons: [
          { label: t('Cancel') },
          { label: t('Continue'), isPrimary: true, closeOnClick: false, disabled: true }
        ]
      });

      // Handle button clicks via the buttonClick event
      this._modalDialog.on('buttonClick', (data: { button: string; }) => {
        if (data.button === t('Continue')) {
          const urlInput = document.getElementById('cka-link-url-input') as HTMLInputElement;
          const organizationInput = document.getElementById('cka-link-org-name-input') as HTMLInputElement;

          const urlPrefix = document.getElementById('url-prefix')?.textContent || 'https://';
          let urlValue = urlInput.value.trim();
          const organization = organizationInput.value.trim();

          // Don't add the prefix if URL already has a protocol
          if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://')) {
            urlValue = urlPrefix + urlValue;
          }

          // Clear any previous error messages
          const errorElement = document.getElementById('cka-url-error');
          if (errorElement) {
            errorElement.style.display = 'none';
          }

          if (urlInput) {
            urlInput.classList.remove('invalid');
          }

          // Check for email links first
          if (urlValue.includes('@')) {
            if (errorElement) {
              errorElement.textContent = t('Email links are not supported. Use the email link tool for emails.');
              errorElement.style.display = 'block';
            }

            // Add invalid class to the .cka-prefix-input container
            setTimeout(() => {
              // Find the prefix input container by class
              const prefixInputContainer = document.querySelector('.cka-prefix-input');
              if (prefixInputContainer) {
                prefixInputContainer.classList.add('invalid');
              }
            }, 10);

            // Focus back on the URL input
            if (urlInput) urlInput.focus();
            return;
          }

          // Validate URL
          if (!this._validateURL(urlValue)) {
            // Show error message
            if (errorElement) {
              if (urlValue.trim() === '') {
                errorElement.textContent = t('URL address is required');
              } else {
                errorElement.textContent = t('Please enter a valid URL address');
              }
              errorElement.style.display = 'block';
            }

            // Add invalid class to the .cka-prefix-input container
            setTimeout(() => {
              // Find the prefix input container by class
              const prefixInputContainer = document.querySelector('.cka-prefix-input');
              if (prefixInputContainer) {
                prefixInputContainer.classList.add('invalid');
              }
            }, 10);

            // Focus back on the URL input
            if (urlInput) urlInput.focus();
            return;
          }

          // Execute the command with the organization as custom data
          // Pass the organization even if empty to ensure removal of existing organization
          editor.execute('alight-external-link', urlValue, { organization });

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
      this._modalDialog.setTitle(isEditing ? t('Edit External Link') : t('Create External Link'));

      // Prepare the form HTML
      const formHTML = this._createFormHTML(t, isEditing);
      this._modalDialog.setContent(formHTML);

      this._modalDialog.show();

      // Reset all validations when showing the modal
      this._resetValidations();

      // Set values if we're editing
      if (isEditing && linkCommand.value) {
        setTimeout(() => {
          const urlInput = document.getElementById('cka-link-url-input') as HTMLInputElement;
          const organizationInput = document.getElementById('cka-link-org-name-input') as HTMLInputElement;
          const allowUnsecureCheckbox = document.getElementById('cka-allow-unsecure-urls') as CkAlightCheckbox;
          const urlPrefixElement = document.getElementById('url-prefix') as HTMLDivElement;
          const continueButton = this._modalDialog?.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;
          const errorElement = document.getElementById('cka-url-error');
          const prefixInputContainer = document.querySelector('.cka-prefix-input');

          if (!urlInput || !organizationInput || !allowUnsecureCheckbox || !urlPrefixElement) {
            return;
          }

          // Clear any validation messages
          if (errorElement) {
            errorElement.style.display = 'none';
          }

          if (prefixInputContainer) {
            prefixInputContainer.classList.remove('invalid');
          }

          let url = linkCommand.value || '';
          const isHttp = url.startsWith('http://');

          // Set the URL input value (without protocol)
          urlInput.value = url.replace(/^https?:\/\//, '');

          // Check the box if it's http://
          allowUnsecureCheckbox.checked = isHttp;

          // Manually update the prefix text and class
          if (isHttp) {
            urlPrefixElement.textContent = 'http://';
            urlPrefixElement.classList.add('unsecure');
          } else {
            urlPrefixElement.textContent = 'https://';
            urlPrefixElement.classList.remove('unsecure');
          }

          // Use the stored organization value from the command
          if (linkCommand.organization !== undefined) {
            organizationInput.value = linkCommand.organization;
          }

          // Update continue button state based on URL value
          // If we're editing, the URL input should already have a value, so enable the Continue button
          if (urlInput.value.trim().length > 0 && !urlInput.value.includes('@') && continueButton) {
            continueButton.disabled = false;
            continueButton.removeAttribute('disabled');
          } else if (continueButton) {
            continueButton.disabled = true;
            continueButton.setAttribute('disabled', 'disabled');
          }
        }, 50);
      }

      // Set up event listener for checkbox changes and URL input
      setTimeout(() => {
        const urlPrefixElement = document.getElementById('url-prefix') as HTMLDivElement;
        const allowUnsecureCheckbox = document.getElementById('cka-allow-unsecure-urls') as CkAlightCheckbox;
        const urlInput = document.getElementById('cka-link-url-input') as HTMLInputElement;

        // Add event listener for checkbox changes
        const handleCheckboxChange = () => {
          const isChecked = allowUnsecureCheckbox.checked;
          if (isChecked) {
            urlPrefixElement.textContent = 'http://';
            urlPrefixElement.classList.add('unsecure');
          } else {
            urlPrefixElement.textContent = 'https://';
            urlPrefixElement.classList.remove('unsecure');
          }
        };

        allowUnsecureCheckbox.addEventListener('change', handleCheckboxChange);

        // Add event listener for URL input changes
        // Updated input handler in _showUI method

        // Add event listener for URL input changes
        urlInput.addEventListener('input', () => {
          // Update continue button state
          this._updateContinueButtonState();

          // Get value for validation
          const value = urlInput.value.trim();
          const errorElement = document.getElementById('cka-url-error');
          const prefixInputContainer = document.querySelector('.cka-prefix-input');

          // Check for email addresses during typing
          if (value.includes('@')) {
            // Show email error message immediately during typing
            if (errorElement) {
              errorElement.textContent = t('Email links are not supported. Use the email link tool for email links.');
              errorElement.style.display = 'block';
            }

            if (prefixInputContainer) {
              prefixInputContainer.classList.add('invalid');
            }
          } else if (value.length > 0 && !value.includes('.')) {
            // Show domain error message if user types something without a dot
            if (errorElement) {
              errorElement.textContent = t('URLs must include a domain (e.g., example.com)');
              errorElement.style.display = 'block';
            }

            if (prefixInputContainer) {
              prefixInputContainer.classList.add('invalid');
            }
          } else {
            // Clear error message if no validation issues
            if (errorElement) {
              errorElement.style.display = 'none';
            }

            if (prefixInputContainer) {
              prefixInputContainer.classList.remove('invalid');
            }
          }
        });

        // Add blur event listener to show validation message if field is empty
        urlInput.addEventListener('blur', () => {
          const value = urlInput.value.trim();
          const errorElement = document.getElementById('cka-url-error');
          const prefixInputContainer = document.querySelector('.cka-prefix-input');

          if (value === '') {
            // Show required field message
            if (errorElement) {
              errorElement.textContent = t('URL address is required');
              errorElement.style.display = 'block';
            }

            if (prefixInputContainer) {
              prefixInputContainer.classList.add('invalid');
            }
          }
        });

        // Add focus event listener to clear validation errors when user focuses the field
        urlInput.addEventListener('focus', () => {
          const errorElement = document.getElementById('cka-url-error');
          const prefixInputContainer = document.querySelector('.cka-prefix-input');

          // Hide error message when focusing the field
          if (errorElement) {
            errorElement.style.display = 'none';
          }

          if (prefixInputContainer) {
            prefixInputContainer.classList.remove('invalid');
          }
        });

        // Focus the URL input
        if (urlInput) {
          urlInput.focus();
        }
      }, 100);
    }
  }

  /**
   * Updates the Continue button state based on the URL input value
   * Enables button only if there's at least one character in the input,
   * it's not an email address, and it has a valid domain (contains a dot)
   */
  private _updateContinueButtonState(): void {
    if (!this._modalDialog) return;

    const urlInput = document.getElementById('cka-link-url-input') as HTMLInputElement;
    const continueButton = this._modalDialog.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;

    if (urlInput && continueButton) {
      const inputValue = urlInput.value.trim();
      const hasValue = inputValue.length > 0;
      const isEmail = inputValue.includes('@');
      const hasDot = inputValue.includes('.');

      // Only enable the button if there is a value, it's not an email, and it has a dot
      const shouldEnable = hasValue && !isEmail && hasDot;

      // Set disabled property directly on the button
      continueButton.disabled = !shouldEnable;

      if (shouldEnable) {
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
      <div class="cka-url-form-container">
        <div class="cka-url-form-url-container">
          <label for="cka-link-url-input" class="cka-input-label">${t('URL')}</label>
          <div class="cka-prefix-input">
            <div id="url-prefix" class="cka-url-prefix-text">https://</div>
            <input id="cka-link-url-input" type="text" class="cka-input-text cka-prefix-input-text" placeholder="${t('example.com')}" required/>
          </div>
          <div id="cka-url-error" class="cka-error-message" style="display:none;">${t('Please enter a valid web address.')}</div>

          <label for="cka-link-org-name-input" class="cka-input-label mt-3">${t('Organization Name (optional)')}</label>
          <input id="cka-link-org-name-input" type="text" class="cka-input-text cka-width-100" placeholder="${t('Organization Name')}"/>
      
          <div class="cka-checkbox-container mt-3">
            <cka-checkbox id="cka-allow-unsecure-urls">${t('Allow unsecure HTTP URLs')}</cka-checkbox>
          </div>
      
          <div class="cka-note-text">
            ${t('Organization Name (optional): Specify the third-party organization to inform users about the link\'s origin.')}
          </div>
        </div>
      </div>
    `;
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
