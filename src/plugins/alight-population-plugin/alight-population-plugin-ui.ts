// src/plugins/alight-population-plugin/alight-population-plugin-ui.ts
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Command } from '@ckeditor/ckeditor5-core';
import ToolBarIcon from './../../../theme/icons/icon-population.svg';
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
   * The available system population tags
   */
  private _systemPopulationTags: PopulationTagData[] = [];

  /**
   * The available created population tags
   */
  private _createdPopulationTags: PopulationTagData[] = [];

  /**
   * All combined population tags
   */
  private _allPopulationTags: PopulationTagData[] = [];

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

    // Log available commands before creating buttons (for debugging)
    console.log('UI Plugin Init - Available commands:', Array.from(editor.commands.names()));

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
      // Create the button first
      this.buttonView = new ButtonView(locale);

      this.buttonView.set({
        label: 'Add Population',
        icon: ToolBarIcon,
        tooltip: true,
        isEnabled: false // Start disabled until command is ready
      });

      // Get the command safely - this might be undefined if commands aren't registered yet
      const command = editor.commands.get('alightPopulationPlugin');

      if (command) {
        // Bind button state to command state if command exists
        this.buttonView.bind('isEnabled').to(command, 'isEnabled');

        // Execute the command when the button is clicked
        this.buttonView.on('execute', () => {
          this._showPopulationModal();
        });
      } else {
        console.warn('AlightPopulationPluginUI: "alightPopulationPlugin" command not found - button may not function correctly');

        // Set up a fallback execute handler that checks for command again
        this.buttonView.on('execute', () => {
          const cmd = editor.commands.get('alightPopulationPlugin');
          if (cmd) {
            this._showPopulationModal();
          } else {
            console.error('Command "alightPopulationPlugin" still not available when button executed');
          }
        });
      }

      return this.buttonView;
    });

    // Add the "Remove Population" button
    editor.ui.componentFactory.add('removePopulation', locale => {
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: 'Remove Population',
        icon: ToolBarIcon,
        tooltip: true,
        isEnabled: false // Start disabled until command is ready
      });

      // Get the command safely
      const command = editor.commands.get('removePopulation');

      if (command) {
        // Bind button state to command state if command exists
        buttonView.bind('isEnabled').to(command);

        // Execute the command when the button is clicked
        buttonView.on('execute', () => {
          editor.execute('removePopulation');
        });
      } else {
        console.warn('AlightPopulationPluginUI: "removePopulation" command not found - button may not function correctly');

        // Set up a fallback execute handler
        buttonView.on('execute', () => {
          const cmd = editor.commands.get('removePopulation');
          if (cmd) {
            editor.execute('removePopulation');
          } else {
            console.error('Command "removePopulation" still not available when button executed');
          }
        });
      }

      return buttonView;
    });
  }

  /**
   * Loads the population tags data
   */
  private async loadPopulationData(): Promise<void> {
    if (this.verboseMode) console.log(`Loading population tags...`);

    try {
      // Load system and created population data in parallel
      const [systemData, createdData, allData] = await Promise.all([
        this.loadService.loadSystemPopulationTags(),
        this.loadService.loadCreatedPopulationTags(),
        this.loadService.loadPopulationTags()
      ]);

      this._systemPopulationTags = systemData;
      this._createdPopulationTags = createdData;
      this._allPopulationTags = allData;

      if (this.verboseMode) {
        console.log(`Loaded ${this._systemPopulationTags.length} system populations`);
        console.log(`Loaded ${this._createdPopulationTags.length} created populations`);
        console.log(`Loaded ${this._allPopulationTags.length} total populations`);
      }

      this.isReady = true;
      this._enablePluginButton();
    } catch (error) {
      console.error('Error loading population data:', error);
      this.isReady = true;
      this._enablePluginButton();
    }
  }

  /**
   * Override the parent method to ensure the button gets enabled
   * with the plugin's readiness state
   */
  protected override _enablePluginButton = () => {
    if (this.buttonView) {
      const command = this.editor.commands.get('alightPopulationPlugin');
      if (command) {
        command.refresh();
      } else {
        console.warn('Unable to refresh "alightPopulationPlugin" command - not found');
        // If command doesn't exist, manually enable the button
        this.buttonView.isEnabled = true;
      }
    }
  }

  /**
   * Using this method is no longer needed since we're loading data immediately
   * But keeping it for backwards compatibility - it does nothing now
   */
  protected override setModalContents(): void {
    // load data in the init method
  }

  /**
   * Registers the openPopulationModal command.
   */
  private _registerOpenPopulationModalCommand() {
    const editor = this.editor;

    // Create a custom command class for opening the population modal
    class OpenPopulationModalCommand extends Command {
      override execute(options: { populationName?: string, populationId?: string }) {
        // Access the UI plugin instance to show the modal
        const uiPlugin = editor.plugins.get('AlightPopulationPluginUI') as AlightPopulationPluginUI;
        uiPlugin._showPopulationModal(options.populationName, options.populationId);
      }
    }
    // Register the command
    editor.commands.add('openPopulationModal', new OpenPopulationModalCommand(editor));

    // Log command registration
    console.log('AlightPopulationPluginUI: Registered "openPopulationModal" command');
  }

  /**
   * Updates button states on selection change.
   */
  private _enableButtonsStateTracking() {
    const editor = this.editor;

    // Update the command states on selection change
    editor.model.document.selection.on('change:range', () => {
      const addCommand = editor.commands.get('alightPopulationPlugin');
      const removeCommand = editor.commands.get('removePopulation');

      // Only refresh commands if they exist
      if (addCommand) {
        addCommand.refresh();
      }

      if (removeCommand) {
        removeCommand.refresh();
      }
    });
  }

  /**
   * Shows the population modal dialog.
   * 
   * @param {string} [currentPopulation] The current population name if editing.
   * @param {string} [populationId] The current population ID if editing.
   */
  _showPopulationModal(currentPopulation?: string, populationId?: string) {
    const editor = this.editor;
    const t = editor.t;

    // If data isn't ready yet, start loading it
    if (
      this._systemPopulationTags.length === 0 &&
      this._createdPopulationTags.length === 0 &&
      !this.isReady
    ) {
      this.loadPopulationData();
    }

    // Create modal dialog if it doesn't exist
    if (!this._populationModal) {
      this._populationModal = new CkAlightModalDialog({
        title: t('Choose a population'),
        width: '80vw',
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

          if (selectedPopulation && selectedPopulation.title) {
            console.log('Applying population:', selectedPopulation.title);

            // Get the command safely
            const addCommand = editor.commands.get('alightPopulationPlugin');

            if (addCommand) {
              try {
                // If we're editing an existing population, we need to first remove the old one
                if (currentPopulation) {
                  // First check if the removePopulation command is enabled
                  const removeCommand = editor.commands.get('removePopulation');
                  if (removeCommand && removeCommand.isEnabled) {
                    // Execute the remove population command
                    editor.execute('removePopulation');
                  }
                }

                // Execute the add population command with the selected population name and ID
                editor.execute('alightPopulationPlugin', {
                  populationName: selectedPopulation.title,
                  populationId: selectedPopulation.id
                });

                // Hide the modal after creating the population tag
                this._populationModal?.hide();
              } catch (error) {
                console.error('Error applying population tag:', error);

                // Show an error message to the user
                this._showErrorAlert(`Error applying population: ${error.message || 'Unknown error'}`);
              }
            } else {
              console.error('Command "alightPopulationPlugin" not found when trying to apply population');
              this._showErrorAlert('Unable to apply population: command not available');
            }
          } else {
            // Show some feedback that no population was selected
            console.warn('No population selected');
            this._showErrorAlert('Please select a population');
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._populationModal.setTitle(
        currentPopulation ? t('Edit Population: {0}', [currentPopulation]) : t('Choose a Population')
      );
    }

    // Set the modal content container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'cka-population-tabs-container';
    this._populationModal.setContent(modalContainer);

    // Show the modal right away
    this._populationModal.show();

    // Create the content manager with tabs if we have data
    try {
      if (this._systemPopulationTags.length === 0 && this._createdPopulationTags.length === 0) {
        // Show loading message if no population tags found yet
        modalContainer.innerHTML = `
          <div class="cka-loading-container">
            <div class="cka-loading-spinner"></div>
          </div>
        `;

        // Try to load the data if it's not ready yet
        if (!this.isReady) {
          this.loadPopulationData().then(() => {
            if (this._systemPopulationTags.length > 0 || this._createdPopulationTags.length > 0) {
              this._createContentManager(modalContainer, currentPopulation);
            } else {
              modalContainer.innerHTML = `
                <div class="cka-center-modal-message">
                  <p>No population tags available.</p>
                </div>
              `;
            }
          }).catch(error => {
            console.error('Error loading population tags:', error);
            modalContainer.innerHTML = `
              <div class="cka-center-modal-message">
                <p>Error loading population tags: ${error.message || 'Unknown error'}</p>
              </div>
            `;
          });
          return;
        }
      }

      // If we already have data, create the content manager with tabs
      this._createContentManager(modalContainer, currentPopulation);
    } catch (error) {
      console.error('Error setting up population tags:', error);

      // Show error message
      modalContainer.innerHTML = `
        <div class="cka-center-modal-message">
          <p>${error.message || 'Unknown error'}</p>
        </div>
      `;
    }
  }

  /**
   * Helper method to show error alerts in the modal
   */
  private _showErrorAlert(message: string) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'cka-alert cka-alert-error';
    alertDiv.innerHTML = `<div class="cka-alert-warning">${message}</div>`;

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

  /**
   * Creates the ContentManager with tabs and initializes it
   */
  private _createContentManager(container: HTMLElement, currentPopulation?: string): void {
    // If no population tags are available after loading, show a message
    if (this._systemPopulationTags.length === 0 && this._createdPopulationTags.length === 0) {
      container.innerHTML = `
        <div class="cka-center-modal-message">
          <p>No population tags available.</p>
        </div>
      `;
      return;
    }

    // Create the ContentManager with system and created population tabs
    this._populationManager = new ContentManager(
      currentPopulation || '',
      this._systemPopulationTags,
      this._createdPopulationTags
    );

    // Add an event listener for population selection
    this._populationManager.onLinkSelected = (population) => {
      this._updateContinueButtonState(!!population);
    };

    // Initialize the ContentManager with tabs
    this._populationManager.renderContent(container);

    // Set initial button state based on whether we have a current population
    const initialPopulation = this._allPopulationTags.find(tag => tag.populationTagName === currentPopulation);
    this._updateContinueButtonState(!!initialPopulation || !!currentPopulation);
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

    if (this._populationModal) {
      this._populationModal.destroy();
      this._populationModal = null;
    }
  }
}
