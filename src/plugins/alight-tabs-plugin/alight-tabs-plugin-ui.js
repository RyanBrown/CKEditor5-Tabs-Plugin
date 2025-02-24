// src/plugins/alight-tabs-plugin/alight-tabs-plugin-ui.js
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import TabToolbarIcon from './assets/icon-tab.svg';
import './styles/alight-tabs-plugin.scss';

export default class AlightTabsPluginUI extends Plugin {
  // Initializes the plugin, adding UI components and modals.
  init() {
    const editor = this.editor;

    // Register event handlers for buttons and user interactions.
    this._registerEventHandlers(editor);

    // Create modals for delete confirmation and tab count prompt.
    this._createConfirmationModal();
    this._createTabCountPromptModal();

    // Define default configuration options for the Tabs Plugin.
    this.editor.config.define('alightTabsPlugin', {
      enableTabPrompt: true, // Enable prompt for tab count.
      defaultTabCount: 2, // Default number of tabs to insert.
    });
    // Add the Tabs button to the toolbar.
    editor.ui.componentFactory.add('alightTabsPlugin', (locale) => {
      const command = editor.commands.get('alightTabsPlugin');
      const buttonView = new ButtonView(locale);

      buttonView.set({
        icon: TabToolbarIcon,
        label: 'Insert Tabs',
        tooltip: true,
      });
      // Update the button state depending on selection context.
      const updateButtonState = () => {
        const isInDisallowedContext = this.isSelectionInDisallowedContext();
        buttonView.isEnabled = !isInDisallowedContext;
        if (buttonView.element) {
          buttonView.element.classList.toggle('ck-disabled', isInDisallowedContext);
        }
      };
      updateButtonState();
      editor.model.document.selection.on('change:range', updateButtonState);

      buttonView.bind('isEnabled').to(command, 'isEnabled');

      // Execute the TabsPlugin command when the button is clicked.
      this.listenTo(buttonView, 'execute', () => {
        const { enableTabPrompt, defaultTabCount } = this.editor.config.get('alightTabsPlugin');

        if (enableTabPrompt) {
          this._showTabCountPromptModal(defaultTabCount);
        } else {
          editor.execute('alightTabsPlugin', { tabCount: defaultTabCount });
          editor.editing.view.focus();
        }
      });
      return buttonView;
    });
  }
  // Checks if the current selection is within a table or a table cell.
  isSelectionInTableOrCell() {
    const selection = this.editor.model.document.selection;
    return Array.from(selection.getRanges()).some((range) => {
      const start = range.start;
      const end = range.end;
      return !!start.findAncestor('table') || !!start.findAncestor('tableCell') || !!end.findAncestor('table') || !!end.findAncestor('tableCell');
    });
  }
  // Checks if the current selection is within a set of specific ancestor elements.
  isSelectionInAncestors(ancestors) {
    const selection = this.editor.model.document.selection;
    return Array.from(selection.getRanges()).some((range) => {
      return ancestors.some((ancestor) => range.start.findAncestor(ancestor) || range.end.findAncestor(ancestor));
    });
  }
  // Checks if the current selection is within an accordion element.
  isInAccordion() {
    return this.isSelectionInAncestors(['accordion']);
  }
  // Checks if the current selection is within a tab component.
  isInTabComponent() {
    return this.isSelectionInAncestors(['tabTitle', 'tabContent']);
  }
  // Checks if the selection is in a disallowed context (e.g., within a table or accordion).
  isSelectionInDisallowedContext() {
    return this.isSelectionInTableOrCell() || this.isInAccordion() || this.isInTabComponent();
  }
  // Registers event handlers for tab-related buttons and actions.
  _registerEventHandlers(editor) {
    const commandsToDisable = ['link', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'style', 'findAndReplace', 'fontColor', 'fontFamily', 'fontSize', 'fontBackgroundColor', 'highlight', 'alignment', 'insertImage', 'insertTable', 'insertBlockQuote', 'insertHorizontalLine', 'insertMedia'];
    // Toggles the enabled/disabled state of specified commands and toolbar buttons.
    const toggleCommandsAndButtons = (isDisabled) => {
      commandsToDisable.forEach((commandName) => {
        const command = editor.commands.get(commandName);
        if (command) {
          isDisabled ? command.forceDisabled('tabTitle') : command.clearForceDisabled('tabTitle');
        }
        // Disable corresponding toolbar buttons.
        editor.ui.view.toolbar.items.forEach((item) => {
          if (item.buttonView && item.buttonView.commandName === commandName) {
            item.buttonView.isEnabled = !isDisabled;
          }
        });
      });
    };
    // Toggle commands and buttons when focusing or blurring tab titles.
    editor.editing.view.document.on('focus blur', (evt, data) => {
      if (data.target.hasClass && data.target.hasClass('tabTitle')) {
        const isFocused = evt.name === 'focus';
        toggleCommandsAndButtons(isFocused);
      }
    });

    // Disable commands when the editor is ready.
    editor.ui.on('ready', () => {
      toggleCommandsAndButtons(false);
    });

    // Map event handlers to specific tab buttons.
    const eventHandlerMap = {
      addicon: (target) => {
        const pluginId = target.getAttribute('data-plugin-id') || target.findAncestor('alightTabsPlugin')?.getAttribute('data-plugin-id');
        if (pluginId) {
          this._handleAddTab(editor, pluginId);
        } else {
          console.warn('AddTabButton clicked without a valid pluginId.');
        }
      },
      dropicon: (target) => {
        this._handleDeleteTab(editor, target);
      },
      'left-arrow': (target) => {
        this._handleMoveTab(editor, target, -1);
      },
      'right-arrow': (target) => {
        this._handleMoveTab(editor, target, 1);
      },
    };
    // Handle click events for tabs.
    editor.editing.view.document.on(
      'click',
      (evt, data) => {
        const target = data.target;
        for (const [className, handler] of Object.entries(eventHandlerMap)) {
          if (target.hasClass(className)) {
            handler(target);
            return;
          }
        }
        // Handle clicks on tabListItem or tabTitle
        if (target.hasClass('tabTitle')) {
          this._handleTabClick(editor, target);
        } else {
          this._handleTabClick(editor, target);
        }
      },
      { priority: 'high' }
    );
  }

  // Handles tab click events to set the clicked tab as active.
  _handleTabClick(editor, target) {
    const modelElement = editor.editing.mapper.toModelElement(target);

    if (!modelElement) {
      // console.warn('Cannot map clicked element to a model element.');
      return;
    }
    // Find the nearest 'tabListItem' ancestor in the model
    let tabListItem = modelElement;
    while (tabListItem && tabListItem.name !== 'tabListItem') {
      tabListItem = tabListItem.parent;
    }
    if (!tabListItem) {
      // console.warn('Clicked element is not within a tabListItem.');
      return;
    }
    const pluginId = tabListItem.getAttribute('data-plugin-id');
    const tabIndex = parseInt(tabListItem.getAttribute('data-index'), 10);

    if (!pluginId || isNaN(tabIndex)) {
      console.warn('Invalid pluginId or tabIndex in _handleTabClick.');
      return;
    }
    // console.log(`Activating tab for pluginId: ${pluginId}, tabIndex: ${tabIndex}`);
    // Execute the command to set the tab as active.
    editor.execute('setActiveTab', { pluginId, tabIndex });
  }

  // Handles the move tab operation when a user clicks the left or right arrow.
  _handleMoveTab(editor, target, direction) {
    const modelElement = editor.editing.mapper.toModelElement(target);

    if (!modelElement) {
      console.warn('Cannot map clicked view element to a model element.');
      return;
    }
    // Find the nearest tabListItem ancestor.
    let tabListItem = modelElement;
    while (tabListItem && tabListItem.name !== 'tabListItem') {
      tabListItem = tabListItem.parent;
    }
    if (!tabListItem) {
      console.warn('MoveTabButton clicked outside of a tabListItem.');
      return;
    }
    const pluginId = tabListItem.getAttribute('data-plugin-id');
    const tabIndex = parseInt(tabListItem.getAttribute('data-index'), 10);
    // Enhanced debugging output
    console.log(`_handleMoveTab: Retrieved values -> pluginId: ${pluginId}, tabIndex: ${tabIndex}, direction: ${direction}`);
    if (!pluginId || isNaN(tabIndex)) {
      console.warn(`Invalid pluginId or tabIndex in _handleMoveTab. Current values -> pluginId: ${pluginId}, tabIndex: ${tabIndex}`);
      if (!pluginId) console.warn('Missing pluginId.');
      if (isNaN(tabIndex)) console.warn('Missing or invalid tabIndex.');
      return;
    }
    // Execute moveTab with pluginId.
    editor.execute('moveTab', { pluginId, tabIndex, direction });
  }

  // Handles the delete tab operation by showing a confirmation modal.
  _handleDeleteTab(editor, target) {
    const modelElement = editor.editing.mapper.toModelElement(target);

    if (!modelElement) {
      console.warn('Cannot map clicked view element to a model element.');
      return;
    }
    // Find the nearest tabListItem ancestor.
    let tabListItem = modelElement;
    while (tabListItem && tabListItem.name !== 'tabListItem') {
      tabListItem = tabListItem.parent;
    }
    if (!tabListItem) {
      // console.warn('DeleteTabButton clicked outside of a tabListItem.');
      return;
    }
    const pluginId = tabListItem.getAttribute('data-plugin-id');
    const tabIndex = parseInt(tabListItem.getAttribute('data-index'), 10);

    if (!pluginId || isNaN(tabIndex)) {
      console.warn('DeleteTabButton clicked without valid pluginId or tabIndex.');
      return;
    }
    // Show confirmation modal.
    this._showDeleteConfirmationModal(editor, pluginId, tabIndex, tabListItem);
  }

  // Retrieves the text of the tab title from a tabListItem element.
  _getTabTitleTextFromTabListItem(tabListItem) {
    let tabTitleText = '';

    function findTabTitleText(element) {
      for (const child of element.getChildren()) {
        if (child.is('element', 'tabTitle')) {
          const textNodes = Array.from(child.getChildren()).filter((node) => node.is('text'));
          tabTitleText = textNodes.map((textNode) => textNode.data).join('');
          break;
        } else {
          findTabTitleText(child);
        }
      }
    }
    findTabTitleText(tabListItem);
    return tabTitleText;
  }

  // Shows a modal to confirm the deletion of a tab.
  _showDeleteConfirmationModal(editor, pluginId, tabIndex, tabListItem) {
    const modal = document.querySelector('.confirm-delete-modal');
    const confirmYesBtn = document.querySelector('.confirm-delete-yes-btn');
    const confirmNoBtn = document.querySelector('.confirm-delete-no-btn');
    const tabTitlePlaceholder = document.querySelector('.tab-title-placeholder');

    if (!modal || !confirmYesBtn || !confirmNoBtn || !tabTitlePlaceholder) {
      console.warn('DeleteTabCommand: Confirmation modal elements not found.');
      return;
    }
    // Get tab title text.
    const tabTitleText = this._getTabTitleTextFromTabListItem(tabListItem);
    tabTitlePlaceholder.textContent = tabTitleText;

    // Show modal.
    modal.style.display = 'block';

    // Modal event handlers.
    const handleConfirmYes = () => {
      // console.log(`User confirmed deletion of tab with data-index: ${tabIndex}`);
      modal.style.display = 'none';
      editor.execute('deleteTab', { pluginId, tabIndex });
      cleanupEventListeners();
    };
    const handleConfirmNo = () => {
      // console.log(`User canceled deletion of tab with data-index: ${tabIndex}`);
      modal.style.display = 'none';
      cleanupEventListeners();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirmYes();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleConfirmNo();
      }
    };
    const cleanupEventListeners = () => {
      confirmYesBtn.removeEventListener('click', handleConfirmYes);
      confirmNoBtn.removeEventListener('click', handleConfirmNo);
      modal.removeEventListener('keydown', handleKeyDown);
    };

    confirmYesBtn.addEventListener('click', handleConfirmYes);
    confirmNoBtn.addEventListener('click', handleConfirmNo);
    modal.addEventListener('keydown', handleKeyDown);
  }

  // Handles adding a new tab.
  _handleAddTab(editor, pluginId) {
    editor.execute('addTab', { pluginId });
  }

  // Creates the delete confirmation modal.
  _createConfirmationModal() {
    const modalHtml = `
      <div class="confirm-delete-modal" style="display:none;" tabindex="-1">
        <div class="confirm-delete-modal-content">
          <p>Are you sure you want to delete the following tab?</p>
          <p><span class="tab-title-placeholder"></span></p>
          <footer>
            <button class="confirm-delete-yes-btn">Yes</button>
            <button class="confirm-delete-no-btn">No</button>
          </footer>
        </div>
      </div>
    `;
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
  }

  // Creates the tab count prompt modal for the initial tab count input.
  _createTabCountPromptModal() {
    const modalHtml = `
      <div class="tab-count-prompt-modal" style="display:none;" tabindex="-1">
        <div class="tab-count-prompt-modal-content">
          <p>Enter the number of tabs to create:</p>
          <p><input type="number" class="tab-count-input" min="1" value="2" /></p>
          <footer>
            <button class="tab-count-ok-btn">Ok</button>
            <button class="tab-count-cancel-btn">Cancel</button>
          </footer>
        </div>
      </div>
    `;
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
  }

  // Shows the tab count prompt modal and processes user input.
  _showTabCountPromptModal(defaultTabCount) {
    const modal = document.querySelector('.tab-count-prompt-modal');
    const okBtn = document.querySelector('.tab-count-ok-btn');
    const cancelBtn = document.querySelector('.tab-count-cancel-btn');
    const tabCountInput = document.querySelector('.tab-count-input');

    if (!modal || !okBtn || !cancelBtn || !tabCountInput) {
      console.warn('TabCountPromptModal: Modal elements not found.');
      return;
    }

    tabCountInput.value = defaultTabCount;
    modal.style.display = 'block';
    modal.focus();
    tabCountInput.focus();

    const handleOk = () => {
      const userTabCount = parseInt(tabCountInput.value, 10);
      const tabCount = userTabCount > 0 ? userTabCount : defaultTabCount;

      // console.log(`User entered tab count: ${tabCount}`);

      modal.style.display = 'none';

      this.editor.execute('alightTabsPlugin', { tabCount });
      this.editor.editing.view.focus();

      cleanupEventListeners();
    };
    const handleCancel = () => {
      // console.log('User canceled tab count prompt.');
      modal.style.display = 'none';
      cleanupEventListeners();
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleOk();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    };
    const cleanupEventListeners = () => {
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      modal.removeEventListener('keydown', handleKeyDown);
    };

    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('keydown', handleKeyDown);
  }
}
