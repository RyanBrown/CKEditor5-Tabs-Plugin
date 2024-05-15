import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { createTabsPluginElement, createTabElement, findAllDescendants } from './tabs-plugin-utils';
import { TabsPluginCommand, RemoveTabCommand } from './tabs-plugin-command';
import './styles/tabs-plugin.css';

export default class TabsPluginUI extends Plugin {
    init() {
        const editor = this.editor;
        this._insertTabsPlugin(editor);
        this._registerEventHandlers(editor);
    }

    _insertTabsPlugin(editor) {
        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const button = new ButtonView(locale);
            button.set({
                icon: '<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23.1 1.6c-.2-.2-.5-.4-.8-.5-.3-.1-.6-.2-1-.2h-18.5c-.4 0-.7.1-1 .2-.4.1-.6.3-.9.5-.5.5-.9 1.3-.9 2.1v16.6c0 1.5 1.2 2.8 2.8 2.8h18.5c1.5 0 2.8-1.2 2.8-2.8v-16.6c-.1-.8-.5-1.6-1-2.1zm-9.3 1.2c.5 0 .9.4.9.9v3.7h-5.5v-3.7c0-.5.4-.9.9-.9zm8.4 17.5c0 .5-.4.9-.9.9h-18.5c-.5 0-.9-.4-.9-.9v-16.6c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v5.5h14.8zm-5.6-12.9v-3.7c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v3.7z" fill="#3448c5"/></svg>',
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
            });
            button.on('execute', () => {
                editor.model.change((writer) => {
                    const tabsPluginElement = createTabsPluginElement(writer);
                    editor.model.insertContent(tabsPluginElement, editor.model.document.selection.getFirstPosition());
                });
            });
            return button;
        });
    }

    findTabListItem(tabsRoot, tabId) {
        // Utilize findAllDescendants to locate the specific tab list item by attribute
        return findAllDescendants(
            tabsRoot,
            (node) => node.is('element', 'tabListItem') && node.getAttribute('data-target') === `#${tabId}`
        );
    }

    findTabNestedContent(tabsRoot, tabId) {
        // Utilize findAllDescendants to locate the specific tab nested content by ID
        return findAllDescendants(
            tabsRoot,
            (node) => node.is('element', 'tabNestedContent') && node.getAttribute('id') === tabId
        );
    }

    _registerEventHandlers(editor) {
        editor.editing.view.document.on('click', (evt, data) => {
            const target = data.target; // The element that was clicked.
            // console.log(
            // "Event triggered on element:",
            // target.getCustomProperty("type") || target.name
            // );

            // Handle activation of tabs
            if (target.hasClass('tab-list-item')) {
                const tabId = target.getAttribute('data-target').slice(1); // Get tab ID from data-target attribute
                console.log(`Tab clicked with ID: ${tabId}`);
                editor.model.change((writer) => {
                    const tabsRoot = editor.model.document.getRoot();
                    console.log('Processing model change for tab activation');

                    const tabListItem = this.findTabListItem(tabsRoot, tabId)[0];
                    const tabNestedContent = this.findTabNestedContent(tabsRoot, tabId)[0];

                    // Clear active class from all tab list items and tab nested contents
                    console.log("Removing 'active' class from all tabs and contents");
                    const allTabListItems = findAllDescendants(tabsRoot, (node) => node.is('element', 'tabListItem'));
                    const allTabNestedContents = findAllDescendants(tabsRoot, (node) =>
                        node.is('element', 'tabNestedContent')
                    );

                    allTabListItems.concat(allTabNestedContents).forEach((node) => {
                        const currentClasses = node.getAttribute('class') || '';
                        const updatedClasses = currentClasses
                            .split(' ')
                            .filter((cls) => cls !== 'active')
                            .join(' ');
                        writer.setAttribute('class', updatedClasses, node);
                    });

                    // Add 'active' class to the clicked tab list item and corresponding tab nested content
                    if (tabListItem) {
                        writer.setAttribute(
                            'class',
                            (tabListItem.getAttribute('class') || '') + ' active',
                            tabListItem
                        );
                    }
                    if (tabNestedContent) {
                        writer.setAttribute(
                            'class',
                            (tabNestedContent.getAttribute('class') || '') + ' active',
                            tabNestedContent
                        );
                    }
                    console.log('Active classes updated for selected tab and content.');
                });
                evt.stop();
                console.log('Event propagation stopped after tab list item click');
            } else if (target.hasClass('tab-title')) {
                console.log('Tab title clicked, setting focus.');
                editor.editing.view.focus(target);
                evt.stop();
                console.log('Event propagation stopped after tab title click');
            } else if (target.hasClass('remove-tab-button')) {
                const tabListItem = target.findAncestor('li');
                if (tabListItem) {
                    const tabId = tabListItem.getAttribute('data-target').slice(1).replace('#', '');
                    console.log(`Remove tab button clicked for tab ID: ${tabId}`);
                    editor.execute('removeTab', tabId);
                    evt.stop();
                    console.log('Event propagation stopped after remove tab button click');
                }
            } else if (target.hasClass('move-left-button') || target.hasClass('move-right-button')) {
                const tabListItem = target.findAncestor('tabListItem');
                if (tabListItem) {
                    const tabId = tabListItem.getAttribute('data-target').slice(1);
                    const direction = target.hasClass('move-left-button') ? -1 : 1;
                    console.log(`Move button clicked for tab ID: ${tabId}, direction: ${direction}`);
                    editor.execute('moveTab', { tabId: tabId, direction: direction });
                    evt.stop();
                    console.log('Event propagation stopped after move tab button click');
                }
            } else if (target.hasClass('add-tab-button')) {
                console.log('Add tab button clicked.');
                this._addNewTab(editor);
                evt.stop();
                console.log('Event propagation stopped after add tab button click');
            }
        });
    }

    _addNewTab(editor) {
        editor.model.change((writer) => {
            // Get the root element of the document
            const root = editor.model.document.getRoot();

            // Find tabsPlugin, tabList, and tabContent by querying for them directly
            let tabsPlugin = null;
            let tabList = null;
            let tabContent = null;

            // Search for the tabsPlugin element
            for (const node of root.getChildren()) {
                if (node.is('element', 'tabsPlugin')) {
                    tabsPlugin = node;
                    break;
                }
            }

            // If tabsPlugin is not found, create it and append to the root
            if (!tabsPlugin) {
                tabsPlugin = writer.createElement('tabsPlugin');
                writer.append(tabsPlugin, root);
            }

            // Within tabsPlugin, find or create tabList and tabContent
            for (const node of tabsPlugin.getChildren()) {
                if (node.is('element', 'tabList')) {
                    tabList = node;
                } else if (node.is('element', 'tabContent')) {
                    tabContent = node;
                }
            }

            // If not found, create them
            if (!tabList) {
                tabList = writer.createElement('tabList');
                writer.append(tabList, tabsPlugin);
            }
            if (!tabContent) {
                tabContent = writer.createElement('tabContent');
                writer.append(tabContent, tabsPlugin);
            }

            // Generate a unique tabId for the new tab
            const newTabId = `tabs-plugin-ui_newTabId_${Date.now()}`;

            // Use the utility function to create a new tab list item and content
            const { tabListItem, tabNestedContent } = createTabElement(writer, newTabId, false);

            // Find the "Add Tab" button in the tabList
            const addTabButton = tabList.getChild(tabList.childCount - 1);

            // Insert the new tab list item before the "Add Tab" button
            writer.insert(tabListItem, addTabButton, 'before');

            // Append the new tab content to the tabContent
            writer.append(tabNestedContent, tabContent);

            // // Remove active class from all tab list items and tab nested contents
            // const allTabListItems = Array.from(tabList.getChildren()).slice(0, -1); // Exclude the "Add Tab" button
            // const allTabNestedContents = Array.from(tabContent.getChildren());

            // allTabListItems.forEach((item) => {
            //   const currentClasses = item.getAttribute('class') || '';
            //   const updatedClasses = currentClasses.split(' ').filter(cls => cls !== 'active').join(' ');
            //   writer.setAttribute('class', updatedClasses, item);

            //   // Add event listener to remove active class when clicked
            //   this.listenTo(item, 'click', () => {
            //     editor.model.change((writer) => {
            //       const clickedTabId = item.getAttribute('data-target').slice(1);
            //       const clickedTabListItem = this.findTabListItem(tabsPlugin, clickedTabId)[0];
            //       const clickedTabNestedContent = this.findTabNestedContent(tabsPlugin, clickedTabId)[0];

            //       // Remove active class from all tab list items and tab nested contents
            //       allTabListItems.forEach((item) => {
            //         const currentClasses = item.getAttribute('class') || '';
            //         const updatedClasses = currentClasses.split(' ').filter(cls => cls !== 'active').join(' ');
            //         writer.setAttribute('class', updatedClasses, item);
            //       });

            //       allTabNestedContents.forEach((content) => {
            //         const currentClasses = content.getAttribute('class') || '';
            //         const updatedClasses = currentClasses.split(' ').filter(cls => cls !== 'active').join(' ');
            //         writer.setAttribute('class', updatedClasses, content);
            //       });

            //       // Set active class on the clicked tab list item and tab nested content
            //       const clickedTabListItemClasses = (clickedTabListItem.getAttribute('class') || '') + ' active';
            //       writer.setAttribute('class', clickedTabListItemClasses.trim(), clickedTabListItem);

            //       const clickedTabNestedContentClasses = (clickedTabNestedContent.getAttribute('class') || '') + ' active';
            //       writer.setAttribute('class', clickedTabNestedContentClasses.trim(), clickedTabNestedContent);
            //     });
            //   });
            // });

            // allTabNestedContents.forEach((content) => {
            //   const currentClasses = content.getAttribute('class') || '';
            //   const updatedClasses = currentClasses.split(' ').filter(cls => cls !== 'active').join(' ');
            //   writer.setAttribute('class', updatedClasses, content);
            // });

            // // Set active class on the newly inserted tab list item and tab nested content
            // const newTabListItemClasses = (tabListItem.getAttribute('class') || '') + ' active';
            // writer.setAttribute('class', newTabListItemClasses.trim(), tabListItem);

            // const newTabNestedContentClasses = (tabNestedContent.getAttribute('class') || '') + ' active';
            // writer.setAttribute('class', newTabNestedContentClasses.trim(), tabNestedContent);
        });
    }
}
