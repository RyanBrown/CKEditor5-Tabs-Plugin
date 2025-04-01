// src/plugins/alight-population-plugin/alight-population-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Command } from '@ckeditor/ckeditor5-core';
import ToolBarIcon from './../../../theme/icons/icon-population.svg';
import { isSelectionInPopulation } from './alight-population-plugin-utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

/**
 * The UI part of the AlightPopulationsPlugin.
 * This plugin handles the toolbar buttons and modal integration.
 */
export default class AlightPopulationPluginUI extends Plugin {
  /**
   * @inheritDoc
   */
  static get pluginName() {
    return 'AlightPopulationPluginUI';
  }

  /**
   * The modal dialog instance for population selection.
   */
  private _populationModal: CkAlightModalDialog | null = null;

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
  }

  /**
   * Creates the toolbar buttons.
   */
  private _createButtons() {
    const editor = this.editor;

    // Add the "Add Population" button
    editor.ui.componentFactory.add('addPopulation', locale => {
      const command = editor.commands.get('addPopulation');
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: 'Add Population',
        icon: ToolBarIcon,
        tooltip: true
      });

      // Bind button state to command state
      buttonView.bind('isEnabled').to(command);

      // Execute the command when the button is clicked
      buttonView.on('execute', () => {
        this._showPopulationModal();
      });

      return buttonView;
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
      editor.commands.get('addPopulation').refresh();
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

    // Create modal dialog if it doesn't exist
    if (!this._populationModal) {
      this._populationModal = new CkAlightModalDialog({
        title: 'Choose a Population',
        draggable: true,
        resizable: true,
        width: '600px',
        height: '500px',
        modal: true
      });
    }

    // Set the modal title
    this._populationModal.setTitle(currentPopulation
      ? `Edit Population: ${currentPopulation}`
      : 'Choose a Population');

    // Create content for the modal
    // This is a placeholder - you'd integrate with your actual modal content here
    const contentContainer = document.createElement('div');
    contentContainer.className = 'population-modal-content';

    // Add note about pending modal integration
    const modalNote = document.createElement('p');
    modalNote.textContent = 'Integration with the Choose a Population modal.';
    modalNote.style.color = '#666';
    contentContainer.appendChild(modalNote);

    // Create a simple population selection UI for demonstration
    const populationList = document.createElement('div');
    populationList.className = 'population-list';

    // Get sample population options (replace with your actual implementation)
    const populations = this._getSamplePopulations();

    // If there's a current population, put it at the top
    if (currentPopulation) {
      const currentItem = populations.find(pop => pop.name === currentPopulation);
      if (currentItem) {
        // Move to the top
        populations.splice(populations.indexOf(currentItem), 1);
        populations.unshift(currentItem);
      }
    }

    // Create population items
    populations.forEach(population => {
      const item = document.createElement('div');
      item.className = 'population-item';

      if (population.name === currentPopulation) {
        item.classList.add('selected');
      }

      item.textContent = population.name;
      item.dataset.name = population.name;

      item.addEventListener('click', () => {
        // Remove selected class from all items
        document.querySelectorAll('.population-item.selected').forEach(
          el => el.classList.remove('selected')
        );

        // Add selected class to clicked item
        item.classList.add('selected');
      });

      populationList.appendChild(item);
    });

    contentContainer.appendChild(populationList);

    // Set modal content
    this._populationModal.setContent(contentContainer);

    // Add footer with buttons
    const footer = document.createElement('div');
    footer.className = 'population-modal-footer';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cka-button cka-button-outlined';
    cancelButton.addEventListener('click', () => {
      this._populationModal?.hide();
    });

    const selectButton = document.createElement('button');
    selectButton.textContent = 'Select';
    selectButton.className = 'cka-button cka-button-primary';
    selectButton.addEventListener('click', () => {
      // Get the selected population
      const selectedItem = document.querySelector('.population-item.selected') as HTMLElement;
      if (selectedItem && selectedItem.dataset.name) {
        const populationName = selectedItem.dataset.name;

        // Execute the addPopulation command with the selected population
        editor.execute('addPopulation', { populationName });

        // Hide the modal
        this._populationModal?.hide();
      }
    });

    footer.appendChild(cancelButton);
    footer.appendChild(selectButton);

    this._populationModal.setFooter(footer);

    // Show the modal
    this._populationModal.show();
  }

  /**
   * Gets sample population options.
   * This is a placeholder. In a real implementation, you'd get this data
   * from your backend or configuration.
   * 
   * @returns {Array<{name: string, id: string}>} Sample population options.
   */
  private _getSamplePopulations() {
    return [
      { name: 'Admins', id: 'admins' },
      { name: 'Registered Users', id: 'registered_users' },
      { name: 'Premium Members', id: 'premium' },
      { name: 'Content Creators', id: 'creators' },
      { name: 'Moderators', id: 'mods' },
      { name: 'New Users', id: 'new_users' },
      { name: 'Beta Testers', id: 'beta' }
    ];
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