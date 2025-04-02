// src/plugins/alight-population-plugin/alight-population-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Command } from '@ckeditor/ckeditor5-core';
import ToolBarIcon from './../../../theme/icons/icon-population.svg';
import { isSelectionInPopulation } from './alight-population-plugin-utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './ui/popmodal-ContentManager';
import { PopulationTagData } from './ui/popmodal-modal-types';
import AlightDataLoadPlugin from '../../alight-common/alight-data-load-plugin';
import PopulationLoadService from '../../services/population-load-service';

/**
 * The UI part of the AlightPopulationsPlugin.
 * This plugin handles the toolbar buttons and modal integration.
 */
export default class AlightPopulationPluginUI extends AlightDataLoadPlugin {
  /**
   * @inheritDoc
   */
  static override get pluginName() {
    return 'AlightPopulationPluginUI';
  }

  /**
   * The modal dialog instance for population selection.
   */
  private _populationModal: CkAlightModalDialog | null = null;

  /**
   * The content manager for the modal dialog
   */
  private _populationManager: ContentManager | null = null;

  /**
   * The available population tags
   */
  private _populationTags: PopulationTagData[] = [];

  /**
   * The load service for population tags
   */
  private readonly loadService: PopulationLoadService = new PopulationLoadService();

  /**
   * Reference to the button view
   */
  protected override buttonView: InstanceType<typeof ButtonView>;

  /**
   * @inheritDoc
   */
  public override get pluginName(): string { return AlightPopulationPluginUI.pluginName; }
  public override get pluginId(): string { return 'AlightPopulationPlugin'; }

  /**
   * @inheritDoc
   */
  init() {
    const editor = this.editor;

    // Add the "Add Population" and "Remove Population" buttons to the editor toolbar
    this._createButtons();

    // Register the openPopulationModal command
    this._registerOpenPopulationModalCommand();

    // Update buttons states on selection change
    this._enableButtonsStateTracking();

    // Immediately load population tags data
    this.loadPopulationData();
  }

  /**
   * Creates the toolbar buttons.
   */
  private _createButtons() {
    const editor = this.editor;

    // Add the "Add Population" button
    editor.ui.componentFactory.add('alightPopulationPlugin', locale => {
      const command = editor.commands.get('alightPopulationPlugin');
      this.buttonView = new ButtonView(locale);

      this.buttonView.set({
        label: 'Add Population',
        icon: ToolBarIcon,
        tooltip: true,
        isEnabled: false // Start disabled until command is ready
      });

      // Bind button state to command state
      this.buttonView.bind('isEnabled').to(command, 'isEnabled');

      // Execute the command when the button is clicked
      this.buttonView.on('execute', () => {
        this._showPopulationModal();
      });

      return this.buttonView;
    });

    // Add the "Remove Population" button
    editor.ui.componentFactory.add('removePopulation', locale => {
      const command = editor.commands.get('removePopulation');
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: 'Remove Population',
        icon: ToolBarIcon, // You might want to use a different icon
        tooltip: true
      });

      // Bind button state to command state
      buttonView.bind('isEnabled').to(command);

      // Execute the command when the button is clicked
      buttonView.on('execute', () => {
        editor.execute('removePopulation');
      });

      return buttonView;
    });
  }

  /**
   * Loads the population tags data
   */
  private loadPopulationData(): void {
    if (this.verboseMode) console.log(`Loading population tags...`);

    this.loadService.loadPopulationTags().then(
      (data) => {
        this._populationTags = data;
        if (this.verboseMode) console.log(data);
        this.isReady = true;

        // Enable the button as soon as we have data
        this._enablePluginButton();
      },
      (error) => {
        console.error('Error loading population tags:', error);
        // Even if there's an error, we might still want to enable the button
        // with empty data array so the user can see the UI
        this.isReady = true;
        this._enablePluginButton();
      }
    );
  }

  /**
   * Override the parent method to ensure the button gets enabled
   * with the plugin's readiness state
   */
  protected override _enablePluginButton = () => {
    if (this.buttonView) {
      // The button's isEnabled is already bound to the command's isEnabled
      // Refresh the command to update its isEnabled state
      this.editor.commands.get('alightPopulationPlugin').refresh();
    }
  }

  /**
   * Using this method is no longer needed since we're loading data immediately
   * But keeping it for backwards compatibility - it does nothing now
   */
  protected override setModalContents(): void {
    // This is now a no-op, as we load data in the init method
  }

  /**
   * Registers the openPopulationModal command.
   */
  private _registerOpenPopulationModalCommand() {
    const editor = this.editor;

    // Create a custom command class for opening the population modal
    class OpenPopulationModalCommand extends Command {
      override execute(options: { populationName?: string }) {
        // Access the UI plugin instance to show the modal
        const uiPlugin = editor.plugins.get('AlightPopulationPluginUI') as AlightPopulationPluginUI;
        uiPlugin._showPopulationModal(options.populationName);
      }
    }

    // Register the command
    editor.commands.add('openPopulationModal', new OpenPopulationModalCommand(editor));
  }

  /**
   * Updates button states on selection change.
   */
  private _enableButtonsStateTracking() {
    const editor = this.editor;

    // Update the command states on selection change
    editor.model.document.selection.on('change:range', () => {
      // Refresh the commands
      editor.commands.get('alightPopulationPlugin').refresh();
      editor.commands.get('removePopulation').refresh();
    });
  }

  /**
   * Shows the population modal dialog.
   * 
   * @param {string} [currentPopulation] The current population name if editing.
   */
  _showPopulationModal(currentPopulation?: string) {
    const editor = this.editor;
    const t = editor.t;

    // If data isn't ready yet, start loading it
    if (this._populationTags.length === 0 && !this.isReady) {
      this.loadPopulationData();
    }

    // Create modal dialog if it doesn't exist
    if (!this._populationModal) {
      this._populationModal = new CkAlightModalDialog({
        title: t('Choose a Population'),
        draggable: true,
        resizable: true,
        width: '80vw',
        height: 'auto',
        modal: true,
        contentClass: 'cka-population-content',
        buttons: [
          { label: t('Cancel') },
          { label: t('Continue'), isPrimary: true, closeOnClick: false, disabled: true }
        ]
      });

      // Handle modal button clicks
      this._populationModal.on('buttonClick', (data: { button: string; }) => {
        if (data.button === t('Cancel')) {
          this._populationModal?.hide();
          return;
        }

        if (data.button === t('Continue')) {
          // Get the selected population from the content manager
          const selectedPopulation = this._populationManager?.getSelectedLink();

          if (selectedPopulation && selectedPopulation.destination) {
            // Execute the add population command with the selected population name
            editor.execute('alightPopulationPlugin', { populationName: selectedPopulation.title });

            // Hide the modal after creating the population tag
            this._populationModal?.hide();
          } else {
            // Show some feedback that no population was selected
            console.warn('No population selected');

            // Show an alert to the user
            const alertDiv = document.createElement('div');
            alertDiv.className = 'cka-alert cka-alert-error';
            alertDiv.innerHTML = `<div class="cka-alert-warning">Please select a population</div>`;

            // Find the container for the alert and show it
            const modalContent = this._populationModal?.getElement();
            if (modalContent) {
              // Insert at the top
              modalContent.insertBefore(alertDiv, modalContent.firstChild);

              // Remove after a delay
              setTimeout(() => {
                alertDiv.remove();
              }, 10000);
            }
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._populationModal.setTitle(
        currentPopulation ? t('Edit Population: {0}', [currentPopulation]) : t('Choose a Population')
      );
    }

    // Use custom content first for faster loading
    const customContent = this._createCustomContent();
    this._populationModal.setContent(customContent);

    // Show the modal right away
    this._populationModal.show();

    // Then fetch data and initialize the content manager in the background
    try {
      if (this._populationTags.length === 0) {
        // Show loading message if no population tags found yet
        const tagsContainer = customContent.querySelector('#links-container');
        if (tagsContainer) {
          tagsContainer.innerHTML = `
          <div class="cka-loading-container">
            <div class="cka-loading-spinner"></div>
          </div>
        `;

          // Try to load the data if it's not ready yet
          if (!this.isReady) {
            this.loadService.loadPopulationTags().then(
              (data) => {
                this._populationTags = data;
                this.isReady = true;
                this._enablePluginButton();

                // Once data is loaded, refresh the modal content
                this._populateModalContent(customContent, currentPopulation);
              },
              (error) => {
                console.error('Error loading population tags:', error);
                const tagsContainer = customContent.querySelector('#links-container');
                if (tagsContainer) {
                  tagsContainer.innerHTML = `
                <div class="cka-center-modal-message">
                  <p>Error loading population tags: ${error.message || 'Unknown error'}</p>
                </div>
              `;
                }
              }
            );
          }
          return;
        }
      }

      // If we already have data, populate the modal content
      this._populateModalContent(customContent, currentPopulation);
    } catch (error) {
      console.error('Error setting up population tags:', error);

      // Show error message
      const tagsContainer = customContent.querySelector('#links-container');
      if (tagsContainer) {
        tagsContainer.innerHTML = `
        <div class="cka-center-modal-message">
          <p>${error.message || 'Unknown error'}</p>
        </div>
      `;
      }
    }
  }

  /**
   * Populates the modal content with the population tags data
   */
  private _populateModalContent(customContent: HTMLElement, currentPopulation?: string): void {
    // If no population tags are available after loading, show a message
    if (this._populationTags.length === 0) {
      const tagsContainer = customContent.querySelector('#links-container');
      if (tagsContainer) {
        tagsContainer.innerHTML = `
        <div class="cka-center-modal-message">
          <p>No population tags available.</p>
        </div>
      `;
      }
      return;
    }

    // Create the ContentManager with the current population name and population tags data
    this._populationManager = new ContentManager(currentPopulation || '', this._populationTags);

    // Add an event listener for population selection
    this._populationManager.onLinkSelected = (population) => {
      this._updateContinueButtonState(!!population);
    };

    // Initialize the ContentManager with the content element
    this._populationManager.renderContent(customContent);

    // Set initial button state based on whether we have a current population
    const initialPopulation = this._populationTags.find(tag => tag.populationTagName === currentPopulation);
    this._updateContinueButtonState(!!initialPopulation);
  }

  /**
   * Custom HTML content for the population tags
   */
  private _createCustomContent(): HTMLElement {
    const container = document.createElement('div');

    const tagsContainer = document.createElement('div');
    tagsContainer.id = 'links-container';
    tagsContainer.innerHTML = `
      <div class="cka-loading-container">
        <div class="cka-loading-spinner"></div>
      </div>
    `;

    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'cka-pagination';

    container.appendChild(tagsContainer);
    container.appendChild(paginationContainer);

    return container;
  }

  /**
   * Updates the state of the Continue button based on whether a population is selected
   * 
   * @param hasSelection True if a population is selected, false otherwise
   */
  private _updateContinueButtonState(hasSelection: boolean): void {
    if (!this._populationModal) return;

    const continueButton = this._populationModal.getElement()?.querySelector('.cka-dialog-footer-buttons button:last-child') as HTMLButtonElement;

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

  /**
   * @inheritDoc
   */
  override destroy() {
    super.destroy();

    // Clean up the modal dialog
    if (this._populationModal) {
      this._populationModal.destroy();
      this._populationModal = null;
    }
  }
}