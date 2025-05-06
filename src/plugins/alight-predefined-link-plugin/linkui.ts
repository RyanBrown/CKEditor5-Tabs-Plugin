// src/plugins/alight-predefined-link-plugin/linkui.ts
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
import { isLinkElement, isPredefinedLink, extractPredefinedLinkId } from './utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import './../ui-components/alight-checkbox-component/alight-checkbox-component';

// Import the ContentManager and types from the updated location
import { ContentManager } from './ui/linkmodal-ContentManager';
import { PredefinedLink } from './ui/linkmodal-modal-types';
import AlightDataLoadPlugin from '../../alight-common/alight-data-load-plugin';

import LinksLoadService from '../../services/links-load-service';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

const VISUAL_SELECTION_MARKER_NAME = 'alight-predefined-link-ui';

/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightPredefinedLinkPluginUI extends AlightDataLoadPlugin {
  private _modalDialog: CkAlightModalDialog | null = null;
  private _linkManager: ContentManager | null = null;

  public actionsView: LinkActionsView | null = null;

  private _balloon!: ContextualBalloon;
  private _isUpdatingUI: boolean = false;

  private _predefinedLinks: PredefinedLink[] = [];
  private readonly loadService: LinksLoadService = new LinksLoadService();

  // Add flag to track whether data is loaded
  private _dataLoaded: boolean = false;

  public static get requires() {
    return [AlightPredefinedLinkPluginEditing, ContextualBalloon] as const;
  }

  public static override get pluginName(): string { return 'AlightPredefinedLinkPluginUI' as const; }
  public override get pluginName(): string { return AlightPredefinedLinkPluginUI.pluginName; }
  public override get pluginId(): string { return 'AlightPredefinedLinkPlugin'; }

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
    editor.ui.componentFactory.add('alightPredefinedLinkPlugin', locale => {
      this._createButton(ButtonView);
      this.setModalContents();
      return this.buttonView;
    });

    // Listen for command execution to show balloon
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;

    // Listen to selection changes to update button state
    editor.model.document.on('change:selection', () => {
      this._updateButtonState();
    });

    // Also listen to selection changes to detect when user enters a link or clicks on it
    this.listenTo(editor.editing.view.document, 'selectionChange', () => {
      // Use a small delay to ensure the selection is fully updated
      setTimeout(() => {
        this._checkAndShowBalloon();
        this._updateButtonState();
      }, 10);
    });
  }

  /**
   * Updates the button state based on data loading status and selection
   */
  private _updateButtonState(): void {
    const editor = this.editor;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;

    // This will call the refresh() method which checks for selection
    linkCommand.refresh();

    // Button should be enabled only if:
    // 1. The data has been loaded successfully
    // 2. AND the link command is enabled (there's valid selection)
    if (this.buttonView) {
      const shouldBeEnabled = this._dataLoaded && linkCommand.isEnabled;

      // Only update if the state actually changed to avoid unnecessary renders
      if (this.buttonView.isEnabled !== shouldBeEnabled) {
        this.buttonView.set('isEnabled', shouldBeEnabled);
      }
    }
  }

  protected override setModalContents = (): void => {
    if (this.verboseMode) console.log(`Loading predefined links...`);

    // Set data loaded flag to false while loading
    this._dataLoaded = false;

    // Update button state immediately to disable it during loading
    this._updateButtonState();

    this.loadService.loadPredefinedLinks().then(
      (data) => {
        this._predefinedLinks = data;
        if (this.verboseMode) console.log(data);

        // Update the actions view with the loaded predefined links if it's already created
        if (this.actionsView) {
          this.actionsView.setPredefinedLinks(this._predefinedLinks);
        }

        // Set data loaded flag to true when data is loaded
        this._dataLoaded = true;
        this.isReady = true;

        // Update button state after data is loaded
        this._updateButtonState();
      },
      (error) => {
        console.log(error);
        // Keep data loaded flag as false if there was an error
        this._dataLoaded = false;

        // Update button state to reflect the error
        this._updateButtonState();
      }
    );
  }

  private processLinks = (rawLinks: PredefinedLink[]) => {
    // Check if we have the nested predefinedLinksDetails structure
    // and extract the actual links from it
    let processedLinks: any[] = [];

    for (const rawLink of rawLinks as PredefinedLink[]) {
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
    return processedLinks.filter(link =>
      link.destination && link.destination.trim() !== '' &&
      (link.predefinedLinkName || link.name) &&
      (link.predefinedLinkName || link.name).trim() !== ''
    );
  };

  // Checks if the current selection is in a link and shows the balloon if needed
  private _checkAndShowBalloon(): void {
    const selectedLink = this._getSelectedLinkElement();

    // Check if the selected link is a predefined link
    if (selectedLink) {
      const href = selectedLink.getAttribute('href');
      const dataId = selectedLink.getAttribute('data-id');
      const hasAHCustomeClass = selectedLink.hasClass('AHCustomeLink');

      // Show the balloon for predefined links identified by:
      // 1. data-id="predefined_link" attribute
      // 2. AHCustomeLink class
      // 3. URL format matching predefined link pattern
      if ((dataId === 'predefined_link') ||
        hasAHCustomeClass ||
        (href && isPredefinedLink(href as string))) {
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

  // Creates a toolbar AlightPredefinedLinkPlugin button. Clicking this button will show the modal dialog.
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightPredefinedLinkPlugin', () => {
      const button = this._createButton(MenuBarMenuListItemButtonView);

      button.set({
        // Start with button disabled, will be updated when data loads
        isEnabled: false,
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
    this.buttonView = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    this.buttonView.set({
      isEnabled: false, // Start disabled
      label: t('Predefined link'),
      icon: ToolBarIcon,
      isToggleable: true,
      withText: true
    });

    // Bind to command's value for the isOn state
    this.buttonView.bind('isOn').to(command, 'value', value => !!value);

    // Show the modal dialog on button click for creating new links
    this.listenTo(this.buttonView, 'execute', () => this._showUI());

    return this.buttonView as InstanceType<T>;
  }

  // Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-predefined-unlink') as AlightPredefinedLinkPluginUnlinkCommand;

    actionsView.bind('href').to(linkCommand, 'value');

    // Pass the predefined links data to the actions view if available
    if (this._predefinedLinks && this._predefinedLinks.length > 0) {
      actionsView.setPredefinedLinks(this._predefinedLinks);
    }

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

  // Normalize URL for comparison by removing trailing slashes and normalizing protocol
  private _normalizeUrl(url: string): string {
    if (!url) return '';

    // For predefined links, extract the ID for comparison
    const predefinedId = extractPredefinedLinkId(url);
    if (predefinedId) {
      return predefinedId.toLowerCase();
    }

    // Remove trailing slash
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;

    // Simplify protocol for comparison
    normalized = normalized.replace(/^https?:\/\//, '');

    return normalized.toLowerCase();
  }

  // Find predefined link by URL using the links service
  private async _findPredefinedLinkByUrl(url: string): Promise<PredefinedLink | null> {
    try {
      // Extract predefined link ID if present
      const predefinedId = extractPredefinedLinkId(url);

      if (predefinedId) {
        // For predefined links, try to find by exact ID match first
        const exactMatch = this._predefinedLinks.find(link => {
          // Check if the link has a uniqueId that matches
          if (link.uniqueId && link.uniqueId.toString() === predefinedId) {
            return true;
          }

          // If the destination matches the predefined ID
          if (link.destination &&
            (link.destination === predefinedId ||
              link.destination.includes(predefinedId))) {
            return true;
          }

          return false;
        });

        if (exactMatch) {
          return exactMatch;
        }
      }

      // Fallback to normalized URL comparison
      return this._predefinedLinks.find(link => {
        const normalizedDestination = this._normalizeUrl(link.destination as string);
        const normalizedUrl = this._normalizeUrl(url);
        return normalizedDestination === normalizedUrl;
      }) || null;
    } catch (error) {
      console.error('Error finding predefined link by URL:', error);
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
        // Check if it's a predefined link before showing the balloon
        const href = selectedLink.getAttribute('href');
        if (href && isPredefinedLink(href as string)) {
          // Show balloon with actions (edit/unlink) when clicking on a predefined link
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

      // Verify it's a predefined link
      const href = selectedLink.getAttribute('href');
      if (!href || !isPredefinedLink(href as string)) {
        return;
      }

      // Pass the predefined links data to the actions view for lookup
      if (this._predefinedLinks && this._predefinedLinks.length > 0) {
        this.actionsView.setPredefinedLinks(this._predefinedLinks);
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

  // Custom HTML content for the predefined links
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
    // Check if predefined links data is loaded
    if (!this._dataLoaded || this._predefinedLinks.length === 0) {
      console.warn('Cannot show UI - data not loaded yet');
      return;
    }

    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkPluginCommand;

    // Check if there's valid selection
    if (!linkCommand.isEnabled && !isEditing) {
      console.warn('Cannot show UI - no valid selection');
      return;
    }

    // Store the current selection to restore it later
    const originalSelection = editor.model.document.selection;
    const firstRange = originalSelection.getFirstRange();
    const hasText = !originalSelection.isCollapsed && firstRange !== null;

    // Get current link URL if editing
    let initialUrl = '';
    let initialLink: PredefinedLink | null = null;

    if (isEditing && linkCommand.value) {
      initialUrl = linkCommand.value as string;

      // Try to find the link data from the API
      try {
        initialLink = await this._findPredefinedLinkByUrl(initialUrl);

        // If we couldn't find a link by URL but it's a predefined link format,
        // set a flag to force the UI to open in edit mode
        if (!initialLink && isPredefinedLink(initialUrl)) {
          console.log('Predefined link format detected but not found in available links:', initialUrl);
        }
      } catch (error) {
        console.error('Error fetching link data:', error);
      }
    }

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: isEditing ? t('Edit predefined link') : t('Create predefined link'),
        modal: true,
        width: '80vw',
        height: 'auto',
        contentClass: 'cka-predefined-link-content',
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
              this._linkManager.showAlert('Please select a predefined link', 'error');
            }
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._modalDialog.setTitle(isEditing ? t('Edit predefined link') : t('Create predefined link'));
    }

    // Use our custom content first for faster loading
    const customContent = this._createCustomContent();
    this._modalDialog.setContent(customContent);

    // Show the modal right away
    this._modalDialog.show();

    // Then fetch data and initialize the content manager in the background
    try {
      if (this._predefinedLinks.length === 0) {
        // Show message if no links found
        const linksContainer = customContent.querySelector('#links-container');
        if (linksContainer) {
          linksContainer.innerHTML = `
            <div class="cka-center-modal-message">
              <p>No predefined links available.</p>
            </div>
          `;
        }
        return;
      }

      // Create the ContentManager with the initialUrl and predefined links data
      this._linkManager = new ContentManager(initialUrl, this._predefinedLinks);

      // Pass the modal dialog reference to enable/disable the Continue button
      // Add an event listener for link selection
      this._linkManager.onLinkSelected = (link) => {
        this._updateContinueButtonState(!!link);
      };

      // Initialize the ContentManager with the content element
      this._linkManager.renderContent(customContent);

      // Set initial button state based on whether we have an initial link
      this._updateContinueButtonState(!!initialLink);

      // If the URL is a predefined link format but not in our list, show a message
      if (initialUrl && isPredefinedLink(initialUrl) && !initialLink) {
        this._linkManager.showAlert(
          'This predefined link is not in the current list of available links. You can select a new link or cancel.',
          'warning',
          0 // Don't auto-dismiss
        );
      }
    } catch (error) {
      console.error('Error setting up predefined links:', error);

      // Show error message
      const linksContainer = customContent.querySelector('#links-container');
      if (linksContainer) {
        linksContainer.innerHTML = `
          <div class="cka-center-modal-message">
            <p>${error.message || 'Unknown error'}</p>
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

  /**
   * Returns the link element under the editing view's selection or `null` if there is none.
   * More robust handling of selection ranges.
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
      try {
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
      } catch (e) {
        console.error('Error getting selected link element:', e);
        // If there was an error in range processing, try to at least return startLink if possible
        try {
          const range = selection.getFirstRange();
          if (range) {
            return findLinkElementAncestor(range.start);
          }
        } catch (innerError) {
          console.error('Failed to get fallback link element:', innerError);
        }
        return null;
      }
    }
  }
}

// Returns a link element if there's one among the ancestors of the provided `Position`.
function findLinkElementAncestor(position: any): ViewAttributeElement | null {
  try {
    if (!position || !position.getAncestors) {
      return null;
    }

    const ancestors = position.getAncestors();

    for (const ancestor of ancestors) {
      if (isLinkElement(ancestor)) {
        return ancestor.is('attributeElement') ? ancestor : null;
      }
    }

    return null;
  } catch (e) {
    console.error('Error in findLinkElementAncestor:', e);
    return null;
  }
}
