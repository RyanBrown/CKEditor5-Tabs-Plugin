import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import tabToolbarIcon from './assets/icon-tab.svg';
import {
    createTabElement,
    generateId,
    initializeTabsOnLoad,
    setActiveClass,
    removeActiveClass,
    activateTab,
} from './tabs-plugin-utils';
import './styles/tabs-plugin.css';

// Plugin to handle the UI for the tabs plugin
export default class TabsPluginUI extends Plugin {
    // Initializes the plugin when CKEditor is loaded
    init() {
        const editor = this.editor;

        // Initialize existing tabs when the editor is loaded
        initializeTabsOnLoad(editor);

        // Register event handlers (e.g., for clicks, focus) and create a confirmation modal
        this._registerEventHandlers(editor);
        this._createConfirmationModal();

        // Add a button to the CKEditor toolbar to allow inserting new tabs
        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const command = editor.commands.get('tabsPlugin');
            const buttonView = new ButtonView(locale);

            // Configure the toolbar button properties (icon, label, tooltip, etc.)
            buttonView.set({
                icon: tabToolbarIcon,
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
                class: 'tabs-toolbar-button',
            });

            // Update the button's state (enabled/disabled) based on the editor's selection
            const updateButtonState = () => {
                const isInDisallowedContext = this.isSelectionInDisallowedContext();
                buttonView.isEnabled = !isInDisallowedContext;
                if (buttonView.element) {
                    // Add a 'ck-disabled' class when the button should be disabled
                    buttonView.element.classList.toggle('ck-disabled', isInDisallowedContext);
                }
            };

            // Set the button's initial state based on the selection
            updateButtonState();

            // Listen for selection changes to dynamically update the button's state
            editor.model.document.selection.on('change:range', updateButtonState);

            // Bind the button's 'isEnabled' state to the command's state
            buttonView.bind('isEnabled').to(command, 'isEnabled');

            // Execute the tabs plugin command when the button is clicked
            this.listenTo(buttonView, 'execute', () => {
                if (!this.isSelectionInDisallowedContext()) {
                    editor.execute('tabsPlugin');
                    editor.editing.view.focus();
                } else {
                    console.warn('Tabs Plugin cannot be inserted into a disallowed context.');
                }
            });
            return buttonView;
        });
    }

    // Check if the current selection is inside a table or table cell (disallowed context)
    isSelectionInTableOrCell() {
        const selection = this.editor.model.document.selection;
        return Array.from(selection.getRanges()).some((range) => {
            const start = range.start;
            const end = range.end;
            return (
                !!start.findAncestor('table') ||
                !!start.findAncestor('tableCell') ||
                !!end.findAncestor('table') ||
                !!end.findAncestor('tableCell')
            );
        });
    }

    // Generalized function to check if selection is inside any disallowed ancestor elements
    isSelectionInAncestors(ancestors) {
        const selection = this.editor.model.document.selection;
        return Array.from(selection.getRanges()).some((range) => {
            return ancestors.some((ancestor) => range.start.findAncestor(ancestor) || range.end.findAncestor(ancestor));
        });
    }

    // Check if the selection is inside an accordion (disallowed context)
    isInAccordion() {
        return this.isSelectionInAncestors(['accordion']);
    }
    // Check if the selection is inside a tab component (disallowed context)
    isInTabComponent() {
        return this.isSelectionInAncestors(['tabTitle', 'tabContent']);
    }
    // Determines if the selection is in a disallowed context (e.g., table, accordion, or tab component)
    isSelectionInDisallowedContext() {
        return this.isSelectionInTableOrCell() || this.isInAccordion() || this.isInTabComponent();
    }

    // Registers various event handlers for managing tabs (clicks, focus, etc.)
    _registerEventHandlers(editor) {
        // List of commands to disable when a tabTitle is focused
        const commandsToDisable = [
            'link',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            'style',
            'findAndReplace',
            'fontColor',
            'fontFamily',
            'fontSize',
            'fontBackgroundColor',
            'highlight',
            'alignment',
            'insertImage',
            'insertTable',
            'insertBlockQuote',
            'insertHorizontalLine',
            'insertMedia',
        ];

        // Helper function to enable or disable certain editor commands and toolbar buttons
        const toggleCommandsAndButtons = (isDisabled) => {
            commandsToDisable.forEach((commandName) => {
                const command = editor.commands.get(commandName);
                if (command) {
                    // Disable the command if needed
                    isDisabled ? command.forceDisabled('tabTitle') : command.clearForceDisabled('tabTitle');
                }
                // Also update the toolbar buttons corresponding to these commands
                const button = editor.ui.view.toolbar.items.find(
                    (item) => item.buttonView && item.buttonView.commandName === commandName
                );
                if (button) {
                    button.isEnabled = !isDisabled;
                }
            });
        };

        // Map of class names to handler functions
        const eventHandlerMap = {
            addicon: () => this._handleAddTab(editor),
            dropicon: (target, evt) => this._handleDeleteTab(editor, target, evt),
            'left-arrow': (target, evt) => this._handleMoveTab(editor, target, evt, -1),
            'right-arrow': (target, evt) => this._handleMoveTab(editor, target, evt, 1),
        };
        // Event handler to manage various click events
        editor.editing.view.document.on(
            'click',
            (evt, data) => {
                const target = data.target;
                // Loop through the eventHandlerMap and execute the corresponding handler
                for (const [className, handler] of Object.entries(eventHandlerMap)) {
                    if (target.hasClass(className)) {
                        handler(target, evt);
                        return; // Stop once the relevant handler is found
                    }
                }
                // Fallback to handle tab clicks if no other match is found
                this._handleTabClick(editor, target, evt);
            },
            { priority: 'high' } // Set high priority to avoid conflicts with other handlers
        );

        // Disable commands when the tabTitle is focused
        editor.editing.view.document.on('focus', (evt, data) => {
            if (data.target.hasClass('tabTitle')) {
                toggleCommandsAndButtons(true); // Disable commands
            }
        });

        // Re-enable commands when the tabTitle loses focus
        editor.editing.view.document.on('blur', (evt, data) => {
            if (data.target.hasClass('tabTitle')) {
                toggleCommandsAndButtons(false); // Enable commands
            }
        });

        // Ensure toolbar buttons are correctly disabled/enabled when the editor is ready
        editor.ui.on('ready', () => {
            toggleCommandsAndButtons(false); // Initial setup for toolbar buttons
        });
    }

    // Handle tab click events (activate the clicked tab)
    _handleTabClick(editor, target, evt) {
        // Find the nearest 'li' element (the tabListItem) or any parent that contains the 'tablinks' class
        const tabListItem = target.findAncestor((el) => el.is('element', 'li')) || target;

        // Ensure the tabListItem is found and is part of the tabs
        if (tabListItem && tabListItem.hasClass('tablinks')) {
            const tabsPlugin = tabListItem.findAncestor(
                (element) => element.name === 'div' && element.hasClass('tabcontainer')
            );
            if (tabsPlugin) {
                const tabPluginId = tabsPlugin.getAttribute('id');
                // Activate the clicked tab and its corresponding content
                activateTab(editor, tabListItem, tabPluginId);
            }
        }
    }

    // Handle the move tab button click event (left or right movement)
    _handleMoveTab(editor, target, evt, direction) {
        const tabListItem = target.findAncestor('li'); // Find the list item (tab) that contains the clicked button
        const tabId = tabListItem.getAttribute('data-target').slice(1); // Get the tab's ID (without '#')
        const tabPluginId = tabListItem.getAttribute('data-plugin-id'); // Get the plugin ID for this tab
        const wasActive = tabListItem.hasClass('active'); // Check if the tab is currently active

        // **the MoveTabCommand is executed:**
        // Execute the moveTab command, moving the tab left (-1) or right (1)
        editor.model.change((writer) => {
            editor.execute('moveTab', { tabId, direction });

            if (wasActive) {
                // If the tab being moved was active, we need to activate the newly moved tab
                // Find the moved tab in the DOM (based on sibling relationships)
                const movedTabListItem = Array.from(tabListItem.parent.getChildren())
                    .filter((item) => item.is('element', 'li') && item.hasClass('tablinks'))
                    .find((item) => item.getAttribute('data-target') === `#${tabId}`);

                if (movedTabListItem) {
                    // Re-activate the moved tab and its corresponding content
                    activateTab(editor, movedTabListItem, tabPluginId);
                }
            }
        });
    }

    // Handle the delete tab button click event
    _handleDeleteTab(editor, target, evt) {
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const tabPluginId = tabListItem.getAttribute('data-plugin-id');
        const wasActive = tabListItem.hasClass('active'); // Check if the deleted tab was active

        // Pre-select modal elements
        const modal = document.querySelector('.confirm-delete-modal');
        const confirmYesBtn = document.querySelector('.confirm-delete-yes-btn');
        const confirmNoBtn = document.querySelector('.confirm-delete-no-btn');

        // Show the confirmation modal
        modal.style.display = 'block';

        // Confirm tab deletion
        const handleConfirmYes = () => {
            modal.style.display = 'none'; // Hide modal on confirmation

            const tabList = tabListItem.parent;
            const tabListItems = Array.from(tabList.getChildren()).filter(
                (child) => child.is('element', 'li') && child.hasClass('tablinks')
            );
            const tabIndex = tabListItems.indexOf(tabListItem);

            // **the DeleteTabCommand is executed:**
            editor.execute('deleteTab', { tabId });

            // If the deleted tab was active, activate the next tab
            if (wasActive && tabListItems.length > 1) {
                const nextTab = tabListItems[tabIndex + 1] || tabListItems[tabIndex - 1];
                if (nextTab) {
                    activateTab(editor, nextTab, tabPluginId);
                }
            }
        };
        // Cancel tab deletion
        const handleConfirmNo = () => {
            modal.style.display = 'none'; // Hide modal on cancellation
        };
        // Attach event handlers
        confirmYesBtn.onclick = handleConfirmYes;
        confirmNoBtn.onclick = handleConfirmNo;
    }

    // Create a confirmation modal for deleting a tab
    _createConfirmationModal() {
        // Create the modal HTML structure and append it to the body
        const modalHtml = `
      <div class="confirm-delete-modal" style="display:none;">
        <div class="confirm-delete-modal-content">
          <p>Are you sure you want to delete this tab?</p>
          <footer>
            <button class="confirm-delete-yes-btn">Yes</button>
            <button class="confirm-delete-no-btn">No</button>
          </footer>
        </div>
      </div>
    `;
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer); // Append modal to the document body
    }

    // Adds a new tab to the tabs plugin or creates a new tabs plugin if none exists
    _handleAddTab(editor) {
        editor.model.change((writer) => {
            // Attempt to find the closest existing tabsPlugin from the current selection
            let tabsPlugin = this._findClosestTabsPlugin(editor);

            // If no tabsPlugin parent is found, create a new one and append it to the root
            if (!tabsPlugin) {
                const pluginId = generateId('plugin-id');
                tabsPlugin = createTabsPlugin(writer, pluginId);
                writer.append(tabsPlugin, editor.model.document.getRoot());
            }

            const containerDiv = tabsPlugin.getChild(0);
            const tabHeader = containerDiv.getChild(0);
            const tabList = tabHeader.getChild(0);
            const tabContent = containerDiv.getChild(1);

            // Generate a unique tabId for the new tab and get the pluginId from the tabsPlugin
            const newTabId = generateId('tab-id');
            const pluginId = tabsPlugin.getAttribute('id');

            // Create a new tab and its corresponding content
            const { tabListItem, tabNestedContent } = createTabElement(writer, pluginId, newTabId);

            // Set the new tab and its content as active
            setActiveClass(writer, tabListItem);
            setActiveClass(writer, tabNestedContent);

            // Insert the new tab before the "Add Tab" button, or append it to the end
            const addTabButton = tabList.getChildren().find((child) => child.is('element', 'addTabListItem'));
            if (addTabButton) {
                writer.insert(tabListItem, writer.createPositionBefore(addTabButton));
            } else {
                writer.append(tabListItem, tabList);
            }
            // Append the new tab content
            writer.append(tabNestedContent, tabContent);

            // Activate the newly added tab
            activateTab(editor, tabListItem, pluginId);
        });
    }
    // Helper function to find the closest tabsPlugin ancestor
    _findClosestTabsPlugin(editor) {
        let selectedElement = editor.model.document.selection.getSelectedElement();
        // Traverse up the model tree to find the nearest tabsPlugin
        while (selectedElement && !selectedElement.is('element', 'tabsPlugin')) {
            selectedElement = selectedElement.parent;
        }
        return selectedElement;
    }
}
