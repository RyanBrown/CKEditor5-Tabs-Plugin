// Modified linkui.ts file with API service integration
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

import AlightPredefinedLinkPluginEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightPredefinedLinkPluginCommand from './linkcommand';
import type AlightPredefinedLinkPluginUnlinkCommand from './unlinkcommand';
import { isLinkElement, LINK_KEYSTROKE } from './utils';
import CkAlightModalDialog from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import './../ui-components/alight-checkbox-component/alight-checkbox-component';

// Import the new ContentManager and types from the updated location
import { ContentManager } from './ui/linkmodal-ContentManager';
import { ILinkManager } from './ui/linkmodal-ILinkManager';
import { PredefinedLink } from './ui/linkmodal-modal-types';

// Import the services
import { LinksService } from './../../services/links-service';
import { DocsService } from './../../services/docs-service';
import { SessionService } from './../../services/session-service';

import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

const VISUAL_SELECTION_MARKER_NAME = 'alight-predefined-link-ui';

// Define an extended API response type to handle the nested structure
interface APILinkResponse {
  baseOrClientSpecific?: string;
  pageType?: string;
  pageCode?: string;
  domain?: string;
  predefinedLinkName?: string;
  predefinedLinkDescription?: string;
  destination?: string;
  uniqueId?: string | number;
  attributeName?: string;
  attributeValue?: string;
  predefinedLinksDetails?: Array<{
    linkName?: string;
    name?: string;
    description?: string;
    url?: string;
    destination?: string;
    id?: string | number;
    uniqueId?: string | number;
    attributeName?: string;
    attributeValue?: string;
  }>;
  [key: string]: any; // Allow any other properties
}

/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightPredefinedLinkPluginUI extends Plugin {
  private _modalDialog: CkAlightModalDialog | null = null;
  private _linkManager: ContentManager | null = null;

  private _linksService: LinksService | null = null;
  public actionsView: LinkActionsView | null = null;

  private _balloon!: ContextualBalloon;
  private _isUpdatingUI: boolean = false;

  public static get requires() {
    return [AlightPredefinedLinkPluginEditing, ContextualBalloon] as const;
  }

  public static get pluginName() {
    return 'AlightPredefinedLinkPluginUI' as const;
  }

  public static override get isOfficialPlugin(): true {
    return true;
  }

  public init(): void {
    const editor = this.editor;
    const t = this.editor.t;

    // Initialize the services
    this._initServices();

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
          label: t('Create Predefined Link'),
          keystroke: LINK_KEYSTROKE
        },
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
    editor.ui.componentFactory.add('alightPredefinedLinkPlugin', locale => {
      return this._createButton(ButtonView);
    });

    // Listen for command execution to show balloon
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;

    // If executed event is available, use it
    if (typeof linkCommand.on === 'function') {
      this.listenTo(linkCommand, 'executed', () => {
        // Let the model update before showing the balloon
        setTimeout(() => this._checkAndShowBalloon(), 50);
      });
    }

    // Also listen to selection changes to detect when user enters a link or clicks on it
    this.listenTo(editor.editing.view.document, 'selectionChange', () => {
      // Use a small delay to ensure the selection is fully updated
      setTimeout(() => this._checkAndShowBalloon(), 10);
    });
  }

  // Initialize the services with config from editor.
  private _initServices(): void {
    try {
      // Store the session service as a class property so it doesn't get garbage collected
      const sessionService = new SessionService();

      // Check if apiUrl exists in sessionStorage
      if (!sessionStorage.getItem('apiUrl')) {
        // Set a default API URL if none exists
        sessionStorage.setItem('apiUrl', 'https://example.com/api');

        // Also set dummy values for other required session items
        if (!sessionStorage.getItem('dummyColleagueSessionToken')) {
          sessionStorage.setItem('dummyColleagueSessionToken', 'dummy-token');
        }
        if (!sessionStorage.getItem('dummyRequestHeader')) {
          sessionStorage.setItem('dummyRequestHeader', '{"clientId":"dummy-client"}');
        }
      }

      // Initialize links service with the session service
      this._linksService = new LinksService(sessionService);
    } catch (error) {
      console.error('Error initializing services:', error);

      // Fallback to create a basic links service with a dummy implementation
      this._linksService = {
        getPredefinedLinks: async () => {
          return [];
        }
      } as LinksService;
    }
  }

  // Fetch predefined links from the service
  private async _fetchPredefinedLinks(): Promise<PredefinedLink[]> {
    if (!this._linksService) {
      console.warn('Links service not initialized');
      return [];
    }

    try {
      // Get links from the service
      const rawLinks = await this._linksService.getPredefinedLinks();

      // If we got empty links, return empty array
      if (!rawLinks || rawLinks.length === 0) {
        console.warn('No predefined links returned from service');
        return [];
      }

      // Check if we have the nested predefinedLinksDetails structure
      // and extract the actual links from it
      let processedLinks: any[] = [];

      for (const rawLink of rawLinks as APILinkResponse[]) {
        if (rawLink.predefinedLinksDetails && Array.isArray(rawLink.predefinedLinksDetails)) {
          // The API response has nested predefinedLinksDetails - extract and process those
          console.log(`Found ${rawLink.predefinedLinksDetails.length} nested links for ${rawLink.pageCode}`);

          // Process each nested link and add parent data
          rawLink.predefinedLinksDetails.forEach((nestedLink) => {
            processedLinks.push({
              // Base properties from parent link
              baseOrClientSpecific: rawLink.baseOrClientSpecific || 'base',
              pageType: rawLink.pageType || 'Unknown',
              pageCode: rawLink.pageCode || '',
              domain: rawLink.domain || '',

              // Properties from nested link
              predefinedLinkName: nestedLink.linkName || nestedLink.name || 'Unnamed Link',
              predefinedLinkDescription: nestedLink.description || '',
              destination: nestedLink.url || nestedLink.destination || '',
              uniqueId: nestedLink.id || nestedLink.uniqueId || '',
              attributeName: nestedLink.attributeName || '',
              attributeValue: nestedLink.attributeValue || ''
            });
          });
        } else {
          // Standard link without nesting
          processedLinks.push(rawLink);
        }
      }

      // Process links directly without transformation
      const links = processedLinks.filter(link =>
        link.destination && link.destination.trim() !== '' &&
        (link.predefinedLinkName || link.name) &&
        (link.predefinedLinkName || link.name).trim() !== ''
      );

      console.log(`Final links: ${links.length}`);

      // Return empty array if no valid links
      if (links.length === 0) {
        console.warn('No valid links found');
        return [];
      }

      return links;
    } catch (error) {
      console.error('Error fetching predefined links:', error);
      return [];
    }
  }

  // Checks if the current selection is in a link and shows the balloon if needed
  private _checkAndShowBalloon(): void {
    const selectedLink = this._getSelectedLinkElement();
    if (selectedLink) {
      this._showBalloon();
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

  // Creates a toolbar AlightPredefinedLinkPlugin button. Clicking this button will show the modal dialog.
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightPredefinedLinkPlugin', () => {
      const button = this._createButton(MenuBarMenuListItemButtonView);

      button.set({
        role: 'menuitemcheckbox'
      });

      return button;
    });
  }

  // Creates a button for link command to use either in toolbar or in menu bar.
  private _createButton<T extends typeof ButtonView>(ButtonClass: T): InstanceType<T> {
    const editor = this.editor;
    const locale = editor.locale;
    const command = editor.commands.get('alight-predefined-link')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    view.set({
      label: t('Alight Predefined Link'),
      icon: linkIcon,
      keystroke: LINK_KEYSTROKE,
      isToggleable: true,
      withText: true
    });

    view.bind('isEnabled').to(command, 'isEnabled');
    view.bind('isOn').to(command, 'value', value => !!value);

    // Show the modal dialog on button click for creating new links
    this.listenTo(view, 'execute', () => this._showUI());

    return view;
  }

  // Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-predefined-unlink') as AlightPredefinedLinkPluginUnlinkCommand;

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
      editor.execute('alight-predefined-unlink');
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

  // Find predefined link by URL using the links service
  private async _findPredefinedLinkByUrl(url: string): Promise<PredefinedLink | null> {
    if (!this._linksService) {
      console.warn('Links service not initialized');
      return null;
    }

    try {
      // Fetch all predefined links
      const links = await this._linksService.getPredefinedLinks();

      // Find the matching link by URL - compare regardless of trailing slash or protocol differences
      return links.find(link => {
        const normalizedDestination = this._normalizeUrl(link.destination as string);
        const normalizedUrl = this._normalizeUrl(url);
        return normalizedDestination === normalizedUrl;
      }) || null;
    } catch (error) {
      console.error('Error finding predefined link by URL:', error);
      return null;
    }
  }

  // Normalize URL for comparison by removing trailing slashes and normalizing protocol
  private _normalizeUrl(url: string): string {
    if (!url) return '';

    // Remove trailing slash
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;

    // Simplify protocol for comparison
    normalized = normalized.replace(/^https?:\/\//, '');

    return normalized.toLowerCase();
  }

  // Attaches actions that control whether the modal dialog should be displayed.
  private _enableUIActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    // Handle click on view document and show balloon when selection is placed inside the link element.
    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', () => {
      const selectedLink = this._getSelectedLinkElement();

      if (selectedLink) {
        // Show balloon with actions (edit/unlink) when clicking on a link
        this._showBalloon();
      }
    });

    // Handle the `Ctrl+K` keystroke and show the modal dialog for new links.
    editor.keystrokes.set(LINK_KEYSTROKE, (keyEvtData, cancel) => {
      // Prevent focusing the search bar in FF, Chrome and Edge.
      cancel();

      if (editor.commands.get('alight-predefined-link')!.isEnabled) {
        this._showUI();
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

  // Sets up ContentManager with necessary structure
  private _setupContentManagerStructure(contentElement: HTMLElement): void {
    // Make sure we have the required containers
    if (!contentElement.querySelector('#search-container-root')) {
      const searchContainer = document.createElement('div');
      searchContainer.id = 'search-container-root';
      searchContainer.className = 'cka-search-container';
      contentElement.insertBefore(searchContainer, contentElement.firstChild);
    }

    if (!contentElement.querySelector('#links-container')) {
      const linksContainer = document.createElement('div');
      linksContainer.id = 'links-container';
      linksContainer.className = 'cka-links-container';
      contentElement.appendChild(linksContainer);
    }

    if (!contentElement.querySelector('#pagination-container')) {
      const paginationContainer = document.createElement('div');
      paginationContainer.id = 'pagination-container';
      paginationContainer.className = 'cka-pagination';
      contentElement.appendChild(paginationContainer);
    }
  }

  // Custom HTML content for the predefined links
  private _createCustomContent(): HTMLElement {
    const container = document.createElement('div');

    const searchContainer = document.createElement('div');
    searchContainer.id = 'search-container-root';
    searchContainer.className = 'cka-search-container';
    searchContainer.innerHTML = `
      <div class="cka-search-input-container">
        <input type="text" id="search-input" class="cka-search-input" placeholder="Search by link name..." />
        <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-text">
          <i class="fa-regular fa-xmark"></i>
        </button>
      </div>
    `;

    const linksContainer = document.createElement('div');
    linksContainer.id = 'links-container';
    linksContainer.className = 'cka-links-container';
    linksContainer.innerHTML = `
      <div class="cka-loading-container">
        <p>Loading predefined links...</p>
        <div class="cka-loading-spinner"></div>
      </div>
    `;

    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'cka-pagination';

    container.appendChild(searchContainer);
    container.appendChild(linksContainer);
    container.appendChild(paginationContainer);

    return container;
  }

  // Shows the modal dialog for link editing.
  private async _showUI(isEditing: boolean = false): Promise<void> {
    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;

    // Get current link URL if editing
    let initialUrl = '';
    let initialLink: PredefinedLink | null = null;

    if (isEditing && linkCommand.value) {
      initialUrl = linkCommand.value as string;

      // Try to find the link data from the API
      try {
        initialLink = await this._findPredefinedLinkByUrl(initialUrl);
      } catch (error) {
        console.error('Error fetching link data:', error);
      }
    }

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: isEditing ? t('Edit Predefined Link') : t('Create Predefined Link'),
        modal: true,
        width: '80vw',
        height: 'auto',
        contentClass: 'cka-predefined-link-content',
        buttons: [
          { label: t('Cancel'), variant: 'outlined', shape: 'round', disabled: false },
          { label: t('Continue'), variant: 'default', isPrimary: true, shape: 'round', closeOnClick: false, disabled: false }
        ]
      });

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === t('Cancel')) {
          this._modalDialog?.hide();
          return;
        }

        if (label === t('Continue')) {
          // Get the selected link from the content manager
          const selectedLink = this._linkManager?.getSelectedLink();
          console.log('Selected link:', selectedLink);

          if (selectedLink && selectedLink.destination) {
            // Create the link in the editor using the built-in link command
            linkCommand.execute(selectedLink.destination);

            // Hide the modal after creating the link
            this._modalDialog?.hide();

            // Explicitly force balloon to show after link creation
            setTimeout(() => this._checkAndShowBalloon(), 50);
          } else {
            // Show some feedback that no link was selected
            console.warn('No link selected or missing destination');

            // Show an alert to the user
            const alertDiv = document.createElement('div');
            alertDiv.className = 'cka-alert cka-alert-error';
            alertDiv.innerHTML = `
            <p>Please select a link first.</p>
          `;

            // Find the container for the alert and show it
            const modalContent = this._modalDialog?.element;
            if (modalContent) {
              // Insert at the top
              modalContent.insertBefore(alertDiv, modalContent.firstChild);

              // Remove after a delay
              setTimeout(() => {
                alertDiv.remove();
              }, 3000);
            }
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._modalDialog.setTitle(isEditing ? t('Edit Predefined Link') : t('Create Predefined Link'));
    }

    // Use our custom content first for faster loading
    const customContent = this._createCustomContent();
    this._modalDialog.setContent(customContent);

    // Show the modal right away
    this._modalDialog.show();

    // Then fetch data and initialize the content manager in the background
    try {
      // Fetch predefined links from the service
      const predefinedLinks = await this._fetchPredefinedLinks();
      console.log('Fetched predefined links:', predefinedLinks);

      if (predefinedLinks.length === 0) {
        // Show message if no links found
        const linksContainer = customContent.querySelector('#links-container');
        if (linksContainer) {
          linksContainer.innerHTML = `
          <div class="cka-empty-state">
            <p>No predefined links available.</p>
          </div>
        `;
        }
        return;
      }

      // Create the ContentManager with the initialUrl and predefined links data
      this._linkManager = new ContentManager(initialUrl, predefinedLinks);

      // Initialize the ContentManager with the content element
      this._linkManager.renderContent(customContent);
    } catch (error) {
      console.error('Error setting up predefined links:', error);

      // Show error message
      const linksContainer = customContent.querySelector('#links-container');
      if (linksContainer) {
        linksContainer.innerHTML = `
        <div class="cka-error-state">
          <p>Error loading predefined links.</p>
          <p class="cka-error-details">${error.message || 'Unknown error'}</p>
        </div>
      `;
      }
    }
  }

  // Hides the UI.
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