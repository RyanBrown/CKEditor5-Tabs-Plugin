// src/plugins/alight-existing-document-link/linkui.ts
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

import AlightExistingDocumentLinkPluginEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightExistingDocumentLinkPluginCommand from './linkcommand';
import type AlightExistingDocumentLinkPluginUnlinkCommand from './unlinkcommand';
import { isLinkElement, isExistingDocumentLink, extractExternalDocumentLinkId } from './utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import './../ui-components/alight-checkbox-component/alight-checkbox-component';

// Import the ContentManager and types from the updated location
import { ContentManager } from './ui/linkmodal-ContentManager';
import { DocumentLink } from './ui/linkmodal-modal-types';
import AlightDataLoadPlugin from '../../alight-common/alight-data-load-plugin';
import LinksLoadService from '../../services/links-load-service';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

const VISUAL_SELECTION_MARKER_NAME = 'alight-existing-document-link-ui';

/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightExistingDocumentLinkPluginUI extends AlightDataLoadPlugin {
  private _modalDialog: CkAlightModalDialog | null = null;
  private _linkManager: ContentManager | null = null;

  public actionsView: LinkActionsView | null = null;

  private _balloon!: ContextualBalloon;
  private _isUpdatingUI: boolean = false;

  // Initialize the array to prevent undefined errors
  private _documentLinks: DocumentLink[] = [];
  private readonly loadService: LinksLoadService = new LinksLoadService();

  public static get requires() {
    return [AlightExistingDocumentLinkPluginEditing, ContextualBalloon] as const;
  }

  public static override get pluginName(): string { return 'AlightExistingDocumentLinkPluginUI' as const; }
  public override get pluginName(): string { return AlightExistingDocumentLinkPluginUI.pluginName; }
  public override get pluginId(): string { return "AlightExistingDocumentLinkPlugin"; }

  public static override get isOfficialPlugin(): true {
    return true;
  }

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
        classes: ['ck-fake-link-selection']
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
          ['ck-fake-link-selection', 'ck-fake-link-selection_collapsed'],
          markerElement
        );

        return markerElement;
      }
    });

    // Enable balloon-modal interactions
    this._enableBalloonInteractions();

    // Add the information about the keystrokes to the accessibility database.
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
    editor.ui.componentFactory.add('AlightExistingDocumentLinkPlugin', locale => {
      this._createButton(ButtonView);
      this.setModalContents();
      return this.buttonView;
    });

    // Listen for command execution to show balloon
    const linkCommand = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;

    // Also listen to selection changes to detect when user enters a link or clicks on it
    this.listenTo(editor.editing.view.document, 'selectionChange', () => {
      // Use a small delay to ensure the selection is fully updated
      setTimeout(() => this._checkAndShowBalloon(), 10);
    });
  }

  protected override setModalContents = (): void => {
    if (this.verboseMode) console.log(`Loading existing document links...`);
    this.loadService.loadDocumentLinks().then(
      (data) => {
        this._documentLinks = data || []; // Add null check
        if (this.verboseMode) console.log(data);
        this.isReady = true;
        this._enablePluginButton();
      },
      (error) => console.log(error)
    );
  }

  /**
 * Processes raw document links to ensure they have consistent structure
 * @param rawLinks The raw links to process
 * @returns A filtered list of processed links
 */
  private processLinks = (rawLinks: DocumentLink[]) => {
    // Initialize array to hold processed links
    let processedLinks: any[] = [];

    // Process each raw link
    for (const rawLink of rawLinks) {
      // Check if we have a valid link
      if (rawLink && typeof rawLink === 'object') {
        // Create a processed link with required DocumentLink properties
        const processedLink = {
          serverFilePath: rawLink.serverFilePath || '',
          title: rawLink.title || '',
          fileId: rawLink.fileId || '',
          fileType: rawLink.fileType || '',
          population: rawLink.population || '',
          locale: rawLink.locale || '',
          lastUpdated: rawLink.lastUpdated || 0,
          updatedBy: rawLink.updatedBy || '',
          upointLink: rawLink.upointLink || '',
          documentDescription: rawLink.documentDescription || '',
          expiryDate: rawLink.expiryDate || '',

          // Add destination property needed for link creation
          destination: rawLink.serverFilePath || ''
        };

        processedLinks.push(processedLink);
      }
    }

    // Filter links to ensure they have required properties
    return processedLinks.filter(link =>
      link.serverFilePath &&
      typeof link.serverFilePath === 'string' &&
      link.serverFilePath.trim() !== '' &&
      link.title &&
      typeof link.title === 'string' &&
      link.title.trim() !== ''
    );
  }

  // Checks if the current selection is in a link and shows the balloon if needed
  private _checkAndShowBalloon(): void {
    const selectedLink = this._getSelectedLinkElement();

    // Check if the selected link is a existing document link
    if (selectedLink) {
      const href = selectedLink.getAttribute('href');
      const dataId = selectedLink.getAttribute('data-id');
      const hasDocumentTagClass = selectedLink.hasClass('document_tag');

      // Show the balloon for existing document links identified by:
      // 1. data-id="existing-document_link" attribute
      // 2. document_tag class
      // 3. URL format matching existing document link pattern
      if ((dataId === 'existing-document_link') ||
        hasDocumentTagClass ||
        (href && isExistingDocumentLink(href as string))) {
        this._showBalloon();
      }
    }
  }

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

  // Creates a toolbar AlightExistingDocumentPlugin button. Clicking this button will show the modal dialog.
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:AlightExistingDocumentLinkPlugin', () => {
      const button = this._createButton(MenuBarMenuListItemButtonView);

      button.set({
        isEnabled: this.isReady,
        role: 'menuitemcheckbox'
      });

      return button;
    });
  }

  // Creates a button for link command to use either in toolbar or in menu bar.
  private _createButton<T extends typeof ButtonView>(ButtonClass: T): InstanceType<T> {
    const editor = this.editor;
    const locale = editor.locale;
    const command = editor.commands.get('alight-existing-document-link')!;
    this.buttonView = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    this.buttonView.set({
      isEnabled: this.isReady,
      label: t('Existing document link'),
      icon: ToolBarIcon,
      isToggleable: true,
      withText: true
    });

    this.buttonView.bind('isEnabled').to(command, 'isEnabled', (command) => command && this.isReady);
    this.buttonView.bind('isOn').to(command, 'value', value => !!value);

    // Show the modal dialog on button click for creating new links
    this.listenTo(this.buttonView, 'execute', () => this._showUI());

    return this.buttonView as InstanceType<T>;
  }

  // Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-existing-document-unlink') as AlightExistingDocumentLinkPluginUnlinkCommand;

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
      editor.execute('alight-existing-document-unlink');
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

  // Normalize URL for comparison by removing trailing slashes and normalizing protocol
  private _normalizeUrl(url: string): string {
    if (!url) return '';

    // For existing document links, extract the ID for comparison
    const existingDocumentId = extractExternalDocumentLinkId(url);
    if (existingDocumentId) {
      return existingDocumentId.toLowerCase();
    }

    // Remove trailing slash
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;

    // Simplify protocol for comparison
    normalized = normalized.replace(/^https?:\/\//, '');

    return normalized.toLowerCase();
  }

  // Find document link by URL using the links service
  /**
 * Find document link by URL using the links service
 * @param url The URL to find a matching document link for
 * @returns The matching document link or null if not found
 */
  private async _findExistingDocumentByUrl(url: string): Promise<DocumentLink | null> {
    try {
      // Extract existing document link ID if present
      const existingDocumentId = extractExternalDocumentLinkId(url);

      if (existingDocumentId) {
        // For existing document links, try to find by matching serverFilePath
        const exactMatch = this._documentLinks.find(link => {
          // If the serverFilePath matches the existing document ID
          if (link.serverFilePath &&
            (link.serverFilePath === existingDocumentId ||
              link.serverFilePath.includes(existingDocumentId))) {
            return true;
          }

          return false;
        });

        if (exactMatch) {
          return exactMatch;
        }
      }

      // Fallback to normalized URL comparison
      return this._documentLinks.find(link => {
        const normalizedDestination = this._normalizeUrl(link.serverFilePath);
        const normalizedUrl = this._normalizeUrl(url);
        return normalizedDestination === normalizedUrl;
      }) || null;
    } catch (error) {
      console.error('Error finding existing document link by URL:', error);
      return null;
    }
  }

  // Attaches actions that control whether the modal dialog should be displayed.
  private _enableUIActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    // Handle click on view document and show balloon when selection is placed inside the link element.
    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', () => {
      const selectedLink = this._getSelectedLinkElement();

      if (selectedLink) {
        // Check if it's a existing document link before showing the balloon
        const href = selectedLink.getAttribute('href');
        if (href && isExistingDocumentLink(href as string)) {
          // Show balloon with actions (edit/unlink) when clicking on a existing document link
          this._showBalloon();
        }
      }
    });
  }

  // Enable interactions between the balloon and modal interface.
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

  // Shows balloon with link actions.
  private _showBalloon(): void {
    if (this.actionsView && this._balloon && !this._balloon.hasView(this.actionsView)) {
      // Make sure the link is still selected before showing balloon
      const selectedLink = this._getSelectedLinkElement();
      if (!selectedLink) {
        return;
      }

      // Verify it's a existing document link
      const href = selectedLink.getAttribute('href');
      if (!href || !isExistingDocumentLink(href as string)) {
        return;
      }

      this._balloon.add({
        view: this.actionsView,
        position: this._getBalloonPositionData()
      });

      // Begin responding to UI updates
      this._startUpdatingUI();
    }
  }

  // Returns positioning options for the balloon.
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

  // Determines whether the balloon is visible in the editor.
  private get _areActionsInPanel(): boolean {
    return !!this.actionsView && !!this._balloon && this._balloon.hasView(this.actionsView);
  }

  // Makes the UI respond to editor document changes.
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

  // Custom HTML content for the existing document links
  private _createCustomContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cka-flex-links-wrap';

    const linksContainer = document.createElement('div');
    linksContainer.id = 'links-container';
    linksContainer.innerHTML = `
    <div class="cka-loading-container">
      <div class="cka-loading-spinner"></div>
    </div>
  `;

    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'cka-pagination';

    container.appendChild(linksContainer);
    container.appendChild(paginationContainer);

    return container;
  }

  /**
   * Shows the modal dialog for link editing.
   * @param isEditing Whether we're editing an existing link
   */
  private async _showUI(isEditing: boolean = false): Promise<void> {
    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-existing-document-link') as AlightExistingDocumentLinkPluginCommand;

    // Ensure _documentLinks is initialized
    if (!this._documentLinks) {
      this._documentLinks = [];
    }

    // Store the current selection to restore it later
    const originalSelection = editor.model.document.selection;
    const firstRange = originalSelection.getFirstRange();
    const hasText = !originalSelection.isCollapsed && firstRange !== null;

    // Get current link URL if editing
    let initialUrl = '';
    let initialLink: DocumentLink | null = null;

    if (isEditing && linkCommand.value) {
      initialUrl = linkCommand.value as string;

      // Try to find the link data from the API
      try {
        initialLink = await this._findExistingDocumentByUrl(initialUrl);

        // If we couldn't find a link by URL but it's a existing document link format,
        // set a flag to force the UI to open in edit mode
        if (!initialLink && isExistingDocumentLink(initialUrl)) {
          console.log('Existing document link format detected but not found in available links:', initialUrl);
        }
      } catch (error) {
        console.error('Error fetching link data:', error);
      }
    }

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: isEditing ? t('Edit existing document link') : t('Create existing document link'),
        modal: true,
        width: '80vw',
        height: 'auto',
        contentClass: 'cka-existing-document-link-content',
        buttons: [
          { label: t('Cancel') },
          { label: t('Continue'), isPrimary: true, closeOnClick: false, disabled: true }
        ]
      });

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (data: { button: string; }) => {
        if (data.button === t('Cancel')) {
          this._modalDialog?.hide();
          return;
        }

        if (data.button === t('Continue')) {
          // Get the selected link from the content manager
          const selectedLink = this._linkManager?.getSelectedLink();
          console.log('Selected link:', selectedLink);

          if (selectedLink && selectedLink.destination) {
            // Create the link in the editor using the built-in link command
            // We no longer need to add the suffix
            let href = selectedLink.destination;

            linkCommand.execute(href);

            // Hide the modal after creating the link
            this._modalDialog?.hide();
          } else {
            // Show some feedback that no link was selected
            console.warn('No link selected or missing destination');

            // Show an alert to the user through our ContentManager
            if (this._linkManager) {
              this._linkManager.showAlert('Please select a existing document link', 'error');
            }
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._modalDialog.setTitle(isEditing ? t('Edit existing document link') : t('Create existing document link'));
    }

    // Use our custom content first for faster loading
    const customContent = this._createCustomContent();
    this._modalDialog.setContent(customContent);

    // Show the modal right away
    this._modalDialog.show();

    // Then fetch data and initialize the content manager in the background
    try {
      if (!this._documentLinks || this._documentLinks.length === 0) {
        // Show message if no links found
        const linksContainer = customContent.querySelector('#links-container');
        if (linksContainer) {
          linksContainer.innerHTML = `
            <div class="cka-center-modal-message">
              <p>No existing document links available.</p>
            </div>
          `;
        }
        return;
      }

      // Create the ContentManager with the initialUrl and document links data
      this._linkManager = new ContentManager(initialUrl, this._documentLinks);

      // Pass the modal dialog reference to enable/disable the Continue button
      // Add an event listener for link selection
      this._linkManager.onLinkSelected = (link) => {
        this._updateContinueButtonState(!!link);
      };

      // Initialize the ContentManager with the content element
      this._linkManager.renderContent(customContent);

      // Set initial button state based on whether we have an initial link
      this._updateContinueButtonState(!!initialLink);

      // If the URL is a existing document link format but not in our list, show a message
      if (initialUrl && isExistingDocumentLink(initialUrl) && !initialLink) {
        this._linkManager.showAlert(
          'This existing document link is not in the current list of available links. You can select a new link or cancel.',
          'warning',
          0 // Don't auto-dismiss
        );
      }
    } catch (error) {
      console.error('Error setting up existing document links:', error);

      // Show error message
      const linksContainer = customContent.querySelector('#links-container');
      if (linksContainer) {
        linksContainer.innerHTML = `
          <div class="cka-center-modal-message">
            <p>${error?.message || 'Unknown error'}</p>
          </div>
        `;
      }
    }
  }

  /**
   * Updates the state of the Continue button based on whether a link is selected
   * 
   * @param hasSelection True if a link is selected, false otherwise
   */
  private _updateContinueButtonState(hasSelection: boolean): void {
    if (!this._modalDialog) return;

    const continueButton = this._modalDialog.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;

    if (continueButton) {
      // Update the disabled property
      continueButton.disabled = !hasSelection;

      // Update classes for visual indication
      if (hasSelection) {
        continueButton.classList.remove('ck-disabled');
      } else {
        continueButton.classList.add('ck-disabled');
      }
    }
  }

  // Hides the UI
  private _hideUI(): void {
    // Prevent recursive calls
    if (this._isUpdatingUI) {
      return;
    }

    this._isUpdatingUI = true;

    try {
      // Hide the balloon if it's showing
      if (this.actionsView && this._balloon && this._balloon.hasView(this.actionsView)) {
        this._balloon.remove(this.actionsView);
        this.stopListening(this.editor.ui, 'update');
        if (this._balloon) {
          this.stopListening(this._balloon, 'change:visibleView');
        }
      }
    } catch (error) {
      console.error('Error hiding UI:', error);
    } finally {
      this._isUpdatingUI = false;
    }
  }

  // Returns the link element under the editing view's selection or `null` if there is none.
  private _getSelectedLinkElement(): ViewAttributeElement | null {
    const view = this.editor.editing.view;
    const selection = view.document.selection;
    const selectedElement = selection.getSelectedElement();

    // The selection is collapsed or some widget is selected (especially inline widget).
    if (selection.isCollapsed || selectedElement && isWidget(selectedElement)) {
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

// Returns a link element if there's one among the ancestors of the provided `Position`.
function findLinkElementAncestor(position: any): ViewAttributeElement | null {
  const linkElement = position.getAncestors().find((ancestor: any) => isLinkElement(ancestor));
  return linkElement && linkElement.is('attributeElement') ? linkElement : null;
}
