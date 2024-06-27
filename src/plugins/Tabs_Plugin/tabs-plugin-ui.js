import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { createTabElement, generateId, setupTabClickHandlers, initializeTabsOnLoad } from './tabs-plugin-utils';
import './styles/tabs-plugin.css';

// Plugin to handle the UI for the tabs plugin
export default class TabsPluginUI extends Plugin {
    // Initializes the plugin
    init() {
        const editor = this.editor;
        const t = editor.t;

        // Initialize tabs on load
        initializeTabsOnLoad(editor);
        // Register the tab click handlers
        setupTabClickHandlers(editor);

        this._registerEventHandlers(editor);
        this._createConfirmationModal();

        // Add a button to the editor UI component factory
        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const command = editor.commands.get('tabsPlugin');
            const buttonView = new ButtonView(locale);

            buttonView.set({
                icon: '<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23.1 1.6c-.2-.2-.5-.4-.8-.5-.3-.1-.6-.2-1-.2h-18.5c-.4 0-.7.1-1 .2-.4.1-.6.3-.9.5-.5.5-.9 1.3-.9 2.1v16.6c0 1.5 1.2 2.8 2.8 2.8h18.5c1.5 0 2.8-1.2 2.8-2.8v-16.6c-.1-.8-.5-1.6-1-2.1zm-9.3 1.2c.5 0 .9.4.9.9v3.7h-5.5v-3.7c0-.5.4-.9.9-.9zm8.4 17.5c0 .5-.4.9-.9.9h-18.5c-.5 0-.9-.4-.9-.9v-16.6c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v5.5h14.8zm-5.6-12.9v-3.7c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v3.7z" fill="#333333"/></svg>',
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
            });

            // Bind the button's state to the command's state
            buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

            // Execute the command when the button is clicked
            this.listenTo(buttonView, 'execute', () => {
                editor.execute('tabsPlugin');
                editor.editing.view.focus();
            });
            return buttonView;
        });
    }

    // Registers event handlers for the tabs plugin
    _registerEventHandlers(editor) {
        const commandsToDisable = [
            'link',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            'highlight',
            'alignment',
            'insertImage',
            'insertTable',
            'insertBlockQuote',
            'insertHorizontalLine',
            'insertMedia',
        ];

        editor.editing.view.document.on(
            'click',
            (evt, data) => {
                const target = data.target;
                if (target.hasClass('tablinks') || target.hasClass('tabTitle')) {
                    this._handleTabClick(editor, target, evt);
                } else if (target.hasClass('dropicon')) {
                    this._handleDeleteTab(editor, target, evt);
                } else if (target.hasClass('addicon')) {
                    this._handleAddTab(editor, evt);
                } else if (target.hasClass('left-arrow')) {
                    this._handleMoveTab(editor, target, evt, -1);
                } else if (target.hasClass('right-arrow')) {
                    this._handleMoveTab(editor, target, evt, 1);
                }
            },
            { priority: 'high' }
        ); // Ensure high priority to avoid conflicts with other plugins

        editor.editing.view.document.on('focus', (evt, data) => {
            if (data.target.hasClass('tabTitle')) {
                commandsToDisable.forEach((commandName) => {
                    const command = editor.commands.get(commandName);
                    if (command) {
                        command.forceDisabled('tabTitle');
                    }
                });
            }
        });

        editor.editing.view.document.on('blur', (evt, data) => {
            if (data.target.hasClass('tabTitle')) {
                commandsToDisable.forEach((commandName) => {
                    const command = editor.commands.get(commandName);
                    if (command) {
                        command.clearForceDisabled('tabTitle');
                    }
                });
            }
        });

        // Disable the specified buttons if a tabTitle is focused during toolbar rendering
        editor.ui.on('ready', () => {
            commandsToDisable.forEach((commandName) => {
                const button = editor.ui.view.toolbar.items.find(
                    (item) => item.buttonView && item.buttonView.commandName === commandName
                );
                if (button) {
                    button.on('execute', (evt) => this._preventButtonClick(evt, button), { priority: 'high' });
                }
            });
        });

        // Log the position of the tab list item when clicked
        editor.editing.view.document.on('click', (evt, data) => {
            const target = data.target;
            const tabListItem = target.findAncestor('li');
            if (tabListItem && tabListItem.hasClass('tablinks')) {
                const tabList = tabListItem.parent;
                if (tabList) {
                    const position = Array.from(tabList.getChildren()).indexOf(tabListItem);
                    console.log(`Tab list item position on click: ${position}`);
                }
            }
        });
    }

    // Prevent button click if tabTitle is focused
    _preventButtonClick(evt, button) {
        const editor = this.editor;
        const focusedElement = editor.editing.view.document.selection.editableElement;
        if (focusedElement && focusedElement.hasClass('tabTitle')) {
            evt.stop();
            evt.preventDefault();
            button.isEnabled = false;
        } else {
            button.isEnabled = true;
        }
    }

    // Handle the tab click events
    _handleTabClick(editor, target, evt) {
        let tabListItem = target.findAncestor('li');

        if (tabListItem && tabListItem.hasClass('yui3-tab')) {
            const tabsPlugin = tabListItem.findAncestor(
                (element) => element.name === 'div' && element.hasClass('tabcontainer')
            );
            if (tabsPlugin) {
                const tabContainerId = tabsPlugin.getAttribute('id');
                this._activateTab(editor, tabListItem, tabContainerId);
            } else {
                console.error('TabsPlugin container not found');
            }
        }
        evt.stop();
    }

    // Set the Active tab logic
    _activateTab(editor, tabListItem, tabContainerId) {
        const tabId = tabListItem.getAttribute('data-target').slice(1); // Remove the '#' from the start
        const viewRoot = editor.editing.view.document.getRoot();

        // Find the tabsPlugin element
        const tabsPlugin = Array.from(viewRoot.getChildren()).find(
            (child) =>
                child.is('element', 'div') &&
                child.hasClass('tabcontainer') &&
                child.getAttribute('id') === tabContainerId
        );

        if (!tabsPlugin) {
            // console.error('Tabs plugin element not found');
            return;
        }

        const containerDiv = tabsPlugin.getChild(0);
        const tabHeader = containerDiv.getChild(0);
        const tabList = tabHeader.getChild(0);
        const tabContent = containerDiv.getChild(1);

        if (!tabList || !tabContent) {
            console.error('Tab list or content element not found');
            return;
        }

        editor.editing.view.change((writer) => {
            // Remove 'active' class from all tab list items and tab content elements within this tabs instance
            for (const item of tabList.getChildren()) {
                writer.setAttribute('class', (item.getAttribute('class') || '').replace(' active', ''), item);
            }
            for (const content of tabContent.getChildren()) {
                writer.setAttribute('class', (content.getAttribute('class') || '').replace(' active', ''), content);
            }

            writer.setAttribute('class', (tabListItem.getAttribute('class') || '') + ' active', tabListItem);

            const selectedTabContent = Array.from(tabContent.getChildren()).find(
                (child) => child.getAttribute('id') === tabId
            );
            if (selectedTabContent) {
                writer.setAttribute(
                    'class',
                    (selectedTabContent.getAttribute('class') || '') + ' active',
                    selectedTabContent
                );
            } else {
                // console.error('Selected tab content not found', tabId);
                console.log('TabListItem:', {
                    'data-target': tabListItem.getAttribute('data-target'),
                    class: tabListItem.getAttribute('class'),
                });
                console.log(
                    'TabContent children:',
                    Array.from(tabContent.getChildren()).map((child) => ({
                        id: child.getAttribute('id'),
                        class: child.getAttribute('class'),
                        'data-target': child.getAttribute('data-target'),
                    }))
                );
                console.log(
                    'TabList children:',
                    Array.from(tabList.getChildren()).map((child) => ({
                        'data-target': child.getAttribute('data-target'),
                        class: child.getAttribute('class'),
                    }))
                );
            }
        });
    }

    // Handles the delete tab button click event
    _handleDeleteTab(editor, target, evt) {
        console.log('Delete button clicked');
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const tabContainerId = tabListItem.getAttribute('data-container-id');
        const wasActive = tabListItem.hasClass('active');

        // Show the custom confirmation dialog
        const modal = document.querySelector('.confirm-delete-modal');
        const confirmYes = document.querySelector('.confirm-delete-yes-btn');
        const confirmNo = document.querySelector('.confirm-delete-no-btn');

        modal.style.display = 'block';

        confirmYes.onclick = () => {
            console.log('Delete Confirmed for tabId:', tabId);
            modal.style.display = 'none';

            const tabList = tabListItem.parent;
            const tabListItems = Array.from(tabList.getChildren()).filter(
                (child) => child.is('element', 'li') && child.hasClass('tablinks')
            );
            const index = tabListItems.indexOf(tabListItem);

            // Execute delete command
            editor.execute('deleteTab', { tabId });

            // If the deleted tab was active, activate the next tab
            if (wasActive) {
                editor.editing.view.change((writer) => {
                    let nextTab;
                    if (index < tabListItems.length - 1) {
                        nextTab = tabListItems[index + 1];
                    } else if (index > 0) {
                        nextTab = tabListItems[index - 1];
                    }

                    if (nextTab) {
                        this._activateTab(editor, nextTab, tabContainerId);
                    }
                });
            }
        };
        confirmNo.onclick = () => {
            console.log('Delete Canceled');
            modal.style.display = 'none';
        };
        evt.stop();
    }

    // Handles the add tab button click event
    _handleAddTab(editor, evt) {
        try {
            this._addNewTab(editor);
        } catch (error) {
            console.error('Error while adding new tab:', error);
        }
        evt.stop();
    }

    // Handles the move tab button click event
    _handleMoveTab(editor, target, evt, direction) {
        const tabListItem = target.findAncestor('li');
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const wasActive = tabListItem.hasClass('active');

        editor.model.change((writer) => {
            editor.execute('moveTab', { tabId, direction });

            if (wasActive) {
                const tabList = tabListItem.parent;
                const tabListItems = Array.from(tabList.getChildren()).filter(
                    (child) => child.is('element', 'li') && child.hasClass('tablinks')
                );
                const movedTabListItem = tabListItems.find((item) => item.getAttribute('data-target') === `#${tabId}`);

                if (movedTabListItem) {
                    this._activateTab(editor, movedTabListItem);
                }
            }
        });
        evt.stop();
    }

    // Adds a new tab to the tabs plugin
    _addNewTab(editor) {
        editor.model.change((writer) => {
            // Get the selected element in the editor
            const selectedElement = editor.model.document.selection.getSelectedElement();

            // Find the closest tabsPlugin parent for the selected element
            let tabsPlugin = selectedElement;
            while (tabsPlugin && !tabsPlugin.is('element', 'tabsPlugin')) {
                tabsPlugin = tabsPlugin.parent;
            }

            // If no tabsPlugin parent is found, create a new one
            if (!tabsPlugin) {
                const pluginId = generateId('plugin-id');
                tabsPlugin = createTabsPlugin(writer, pluginId);
                writer.append(tabsPlugin, editor.model.document.getRoot());
            }

            const containerDiv = tabsPlugin.getChild(0) || writer.createElement('containerDiv');
            const tabHeader = containerDiv.getChild(0) || writer.createElement('tabHeader');
            const tabList = tabHeader.getChild(0) || writer.createElement('tabList');
            const tabContent = containerDiv.getChild(1) || writer.createElement('tabContent');

            if (!tabsPlugin.getChild(0)) {
                writer.append(containerDiv, tabsPlugin);
            }
            if (!containerDiv.getChild(0)) {
                writer.append(tabHeader, containerDiv);
            }
            if (!tabHeader.getChild(0)) {
                writer.append(tabList, tabHeader);
            }
            if (!containerDiv.getChild(1)) {
                writer.append(tabContent, containerDiv);
            }

            // Generate a unique tabId for the new tab using centralized method
            const newTabId = generateId('tab-id');
            const pluginId = tabsPlugin.getAttribute('id');

            // Use the utility function to create a new tab list item and content
            const { tabListItem, tabNestedContent } = createTabElement(writer, pluginId, newTabId);

            // Remove 'active' class from all existing tabs and content
            for (const item of tabList.getChildren()) {
                if (item.is('element', 'tabListItem')) {
                    writer.setAttribute('class', (item.getAttribute('class') || '').replace(' active', ''), item);
                }
            }
            for (const content of tabContent.getChildren()) {
                if (content.is('element', 'tabNestedContent')) {
                    writer.setAttribute('class', (content.getAttribute('class') || '').replace(' active', ''), content);
                }
            }

            // Set the new tab and its content as active
            writer.setAttribute('class', 'yui3-tab tablinks active', tabListItem);
            writer.setAttribute('class', 'yui3-tab-panel tabcontent active', tabNestedContent);

            // Find the "Add Tab" button in the tabList
            const addTabButton = Array.from(tabList.getChildren()).find((child) =>
                child.is('element', 'addTabListItem')
            );
            if (addTabButton) {
                // Insert the new tab list item before the "Add Tab" button
                writer.insert(tabListItem, writer.createPositionBefore(addTabButton));
            } else {
                // Append the new tab list item to the end of the tabList
                writer.append(tabListItem, tabList);
            }
            // Append the new tab content to the tabContent
            writer.append(tabNestedContent, tabContent);

            // Log the IDs for debugging
            console.log('New tab ID:', newTabId);
            console.log('Tab list item data-target:', tabListItem.getAttribute('data-target'));
            console.log('Tab nested content ID:', tabNestedContent.getAttribute('id'));
            console.log('Plugin ID:', pluginId);

            // Ensure the changes are applied before activating the new tab
            this._activateTab(editor, tabListItem, pluginId);
        });
    }

    // Create delete tab confirmation modal
    _createConfirmationModal() {
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
        document.body.appendChild(modalContainer);
    }
}
