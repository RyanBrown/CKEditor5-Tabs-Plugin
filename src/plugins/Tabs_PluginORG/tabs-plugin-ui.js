import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { createTabsPluginElement, createTabElement, generateId, _activateTab } from './tabs-plugin-utils';
import './styles/tabs-plugin.css';

// Plugin to handle the UI for the tabs plugin.
export default class TabsPluginUI extends Plugin {
    // Initializes the plugin.
    init() {
        const editor = this.editor;
        this._insertTabsPlugin(editor);
        this._registerEventHandlers(editor);
        this._createConfirmationModal();
    }

    // Inserts the tabs plugin button into the editor's UI
    _insertTabsPlugin(editor) {
        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const button = new ButtonView(locale);
            button.set({
                icon: '<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23.1 1.6c-.2-.2-.5-.4-.8-.5-.3-.1-.6-.2-1-.2h-18.5c-.4 0-.7.1-1 .2-.4.1-.6.3-.9.5-.5.5-.9 1.3-.9 2.1v16.6c0 1.5 1.2 2.8 2.8 2.8h18.5c1.5 0 2.8-1.2 2.8-2.8v-16.6c-.1-.8-.5-1.6-1-2.1zm-9.3 1.2c.5 0 .9.4.9.9v3.7h-5.5v-3.7c0-.5.4-.9.9-.9zm8.4 17.5c0 .5-.4.9-.9.9h-18.5c-.5 0-.9-.4-.9-.9v-16.6c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v5.5h14.8zm-5.6-12.9v-3.7c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v3.7z" fill="#333333"/></svg>',
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
            });

            // Define what happens when the button is clicked
            button.on('execute', () => {
                editor.model.change((writer) => {
                    const selection = editor.model.document.selection;
                    const pluginElement = selection.getFirstPosition().findAncestor('tabsPlugin');

                    if (pluginElement) {
                        console.error('Cannot insert a tabs plugin inside another tabs plugin.');
                        return;
                    }
                    // Generate a unique ID for the new tabs plugin instance
                    const uniqueId = generateId('plugin-id');
                    // Insert the tabs plugin at the current selection
                    const tabsPluginElement = writer.createElement('tabsPlugin', { id: uniqueId });
                    const containerDiv = createTabsPluginElement(writer, uniqueId);
                    writer.append(containerDiv, tabsPluginElement);
                    editor.model.insertContent(tabsPluginElement, editor.model.document.selection);
                });
            });
            return button;
        });
    }

    // Registers event handlers for the tabs plugin
    _registerEventHandlers(editor) {
        const commandsToDisable = ['link', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'];

        editor.editing.view.document.on(
            'click',
            (evt, data) => {
                const target = data.target;
                if (target.hasClass('tablinks') || target.hasClass('tabTitle')) {
                    this._handleTabClick(editor, target, evt);
                } else if (target.hasClass('dropicon')) {
                    this._handleDeleteTab(editor, target, evt);
                } else if (target.hasClass('addicon')) {
                    this._handleAddTab(editor, evt, data); // Pass both evt and data
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

    // Handles the tab click event
    _handleTabClick(editor, target, evt) {
        let tabListItem = target.findAncestor('li');

        if (tabListItem && tabListItem.hasClass('tablinks')) {
            this._activateTab(editor, tabListItem);
        }

        evt.stop();
    }

    // Activates the specified tab.
    _activateTab(editor, tabListItem) {
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const pluginId = tabListItem.getAttribute('data-plugin-id');
        const viewRoot = editor.editing.view.document.getRoot();

        // Find the specific tab container using the plugin-id
        const tabsRootElement = Array.from(viewRoot.getChildren()).find(
            (child) => child.is('element', 'div') && child.getAttribute('id') === pluginId
        );

        console.log('tabsRootElement:', tabsRootElement); // Log the tabsRootElement

        if (!tabsRootElement) {
            console.error('Tabs root element not found');
            return;
        }

        const tabListElement = tabsRootElement.getChild(0).getChild(0).getChild(0);
        const tabContentElement = tabsRootElement.getChild(0).getChild(1);

        if (!tabListElement || !tabContentElement) {
            console.error('Tab list or content element not found');
            return;
        }

        editor.editing.view.change((writer) => {
            for (const item of tabListElement.getChildren()) {
                writer.removeClass('active', item);
            }
            for (const content of tabContentElement.getChildren()) {
                writer.removeClass('active', content);
            }

            writer.addClass('active', tabListItem);
            const selectedTabContent = Array.from(tabContentElement.getChildren()).find(
                (child) => child.getAttribute('id') === tabId
            );
            if (selectedTabContent) {
                writer.addClass('active', selectedTabContent);
            } else {
                console.error('Selected tab content not found');
            }
        });
    }

    // Handles the delete tab button click event.
    _handleDeleteTab(editor, target, evt) {
        const tabListItem = target.findAncestor('li');
        if (!tabListItem) {
            console.error('Tab list item not found for the delete action.');
            return;
        }
        const tabId = tabListItem.getAttribute('data-target').slice(1);
        const pluginId = tabListItem.getAttribute('data-plugin-id');
        const wasActive = tabListItem.hasClass('active');

        // Show the custom confirmation dialog
        const modal = document.querySelector('.confirm-delete-modal');
        const confirmYes = document.querySelector('.confirm-delete-yes-btn');
        const confirmNo = document.querySelector('.confirm-delete-no-btn');

        modal.style.display = 'block';

        confirmYes.onclick = () => {
            modal.style.display = 'none';
            editor.model.change((writer) => {
                console.log(`Executing delete tab command for tabId: ${tabId}, pluginId: ${pluginId}`);
                editor.execute('deleteTab', { tabId, pluginId });

                // Activate the next tab if the deleted tab was active
                if (wasActive) {
                    const tabList = tabListItem.parent;
                    if (!tabList) {
                        console.error('Parent tab list not found.');
                        return;
                    }
                    const tabListItems = Array.from(tabList.getChildren()).filter(
                        (child) => child.is('element', 'li') && child.hasClass('tablinks')
                    );
                    const index = tabListItems.indexOf(tabListItem);

                    const nextTab = tabListItems[index - 1] || tabListItems[index + 1];
                    if (nextTab) {
                        console.log('Activating the next tab:', nextTab);
                        this._activateTab(editor, nextTab);
                    } else {
                        console.error('Next tab to activate not found.');
                    }
                }
            });
        };

        confirmNo.onclick = () => {
            modal.style.display = 'none';
        };

        evt.stop();
    }

    // Handles the add tab button click event.
    _handleAddTab(editor, evt, data) {
        // console.log('Handling add tab');

        const target = data.target;

        if (!target) {
            console.error('No target found for the click event.');
            return;
        }

        const tabsContainer = target.findAncestor((element) => {
            return element.is('element') && element.hasClass('tabcontainer');
        });

        if (tabsContainer) {
            const pluginId = tabsContainer.getAttribute('id');
            console.log('Found tabs plugin with id:', pluginId);

            editor.model.change((writer) => {
                console.log('Executing addTab command with pluginId:', pluginId);
                const result = editor.execute('addTab', { pluginId });
                console.log('addTab command execution result:', result);
            });
        } else {
            console.error('No tabs plugin found for the clicked add button.');
        }

        evt.stop();
    }

    // Handles the move tab button click event.
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
