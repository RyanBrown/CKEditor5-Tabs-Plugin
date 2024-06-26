import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import TabsPluginCommand from './tabs-plugin-command';
import { DeleteTabCommand, MoveTabCommand } from './tabs-plugin-command';
import { generateId, findAllDescendants, ensureActiveTab } from './tabs-plugin-utils';

// Plugin to handle the editing aspects of the tabs plugin
export default class TabsPluginEditing extends Plugin {
    // Define the plugin name
    static get pluginName() {
        return 'TabsPluginEditing';
    }

    // Initialize the plugin
    init() {
        const editor = this.editor;
        editor.commands.add('deleteTab', new DeleteTabCommand(editor));
        editor.commands.add('moveTab', new MoveTabCommand(editor));

        this._ensureTabIds();
        this._defineSchema();
        this._defineConverters();

        // Add the tabsPlugin command to the editor
        this.editor.commands.add('tabsPlugin', new TabsPluginCommand(this.editor));

        // Listen for changes in the model to ensure active class is set if needed
        this.editor.model.document.on('change', () => {
            const writer = this.editor.model.change((writer) => writer);
            ensureActiveTab(writer, this.editor.model);
        });

        this.editor.model.document.on('change:data', () => {
            this._ensureTabIds();
        });

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
            'fontFamily',
            'fontBackgroundColor',
            'highlight',
            'alignment',
            'insertImage',
            'insertTable',
            'insertBlockQuote',
            'insertHorizontalLine',
            'insertMedia',
        ];

        // Add focus event listener for tabTitle
        editor.editing.view.document.on('focus', (evt, data) => {
            if (data.domTarget.closest('.ck-widget__editing') && data.domTarget.closest('.tabTitle')) {
                console.log('tabTitle focused');
                // Disable the specified commands and toolbar buttons
                this._disableCommandsAndButtons(commandsToDisable, true);
            }
        });

        // Add blur event listener for tabTitle to re-enable the specified buttons
        editor.editing.view.document.on('blur', (evt, data) => {
            if (data.domTarget.closest('.ck-widget__editing') && data.domTarget.closest('.tabTitle')) {
                // Re-enable the specified commands and toolbar buttons
                this._disableCommandsAndButtons(commandsToDisable, false);
            }
        });

        // Prevent command execution if a tabTitle is focused
        editor.ui.on('ready', () => {
            commandsToDisable.forEach((commandName) => {
                const command = editor.commands.get(commandName);
                if (command) {
                    command.on(
                        'execute',
                        (evt, data) => {
                            const focusedElement = editor.editing.view.document.selection.editableElement;
                            if (focusedElement && focusedElement.hasClass('tabTitle')) {
                                if (typeof evt.stop === 'function') {
                                    evt.stop();
                                }
                                if (typeof evt.preventDefault === 'function') {
                                    evt.preventDefault();
                                }
                            }
                        },
                        { priority: 'high' }
                    );
                }
            });
        });
    }

    // Disables or enables the specified commands and their corresponding toolbar buttons.
    _disableCommandsAndButtons(commandsToDisable, disable) {
        const editor = this.editor;
        commandsToDisable.forEach((commandName) => {
            const command = editor.commands.get(commandName);
            if (command) {
                if (disable) {
                    command.forceDisabled('tabTitle');
                } else {
                    command.clearForceDisabled('tabTitle');
                }
            }
            const button = editor.ui.view.toolbar.items.find(
                (item) => item.buttonView && item.buttonView.commandName === commandName
            );
            if (button) {
                button.isEnabled = !disable;
            }
        });
    }

    // Make sure tab ids are always set
    _ensureTabIds() {
        const editor = this.editor;
        const model = editor.model;

        model.change((writer) => {
            const root = model.document.getRoot();
            const tabsPlugins = findAllDescendants(root, (node) => node.is('element', 'tabsPlugin'));

            tabsPlugins.forEach((tabsPlugin) => {
                const containerDiv = tabsPlugin.getChild(0);
                if (!containerDiv) return;

                const tabHeader = containerDiv.getChild(0);
                const tabContent = containerDiv.getChild(1);
                if (!tabHeader || !tabContent) return;

                const tabList = tabHeader.getChild(0);
                if (!tabList) return;

                const tabListItems = Array.from(tabList.getChildren()).filter((child) =>
                    child.is('element', 'tabListItem')
                );
                const tabNestedContents = Array.from(tabContent.getChildren()).filter((child) =>
                    child.is('element', 'tabNestedContent')
                );

                tabListItems.forEach((tabListItem, index) => {
                    const tabNestedContent = tabNestedContents[index];
                    if (!tabListItem || !tabNestedContent) return;

                    const dataTarget = tabListItem.getAttribute('data-target');
                    const contentId = tabNestedContent.getAttribute('id');

                    if (!dataTarget || !contentId || dataTarget !== `#${contentId}`) {
                        const newId = generateId('tab-id');
                        writer.setAttribute('data-target', `#${newId}`, tabListItem);
                        writer.setAttribute('id', newId, tabNestedContent);
                    }
                });
            });
        });
    }

    // Define the schema for the tabs plugin elements
    _defineSchema() {
        const schema = this.editor.model.schema;

        // Define the schema for the tabsPlugin element
        schema.register('tabsPlugin', {
            allowAttributes: ['class', 'id'],
            isObject: true,
            allowWhere: '$block',
        });
        // Prevent nesting of tabsPlugin elements
        schema.addChildCheck((context, childDefinition) => {
            if (childDefinition.name === 'tabsPlugin' && context.endsWith('tabsPlugin')) {
                return false;
            }
        });
        // Define the schema for the containerDiv element
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
        });
        // Define the schema for the tabHeader element
        schema.register('tabHeader', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
            isLimit: true,
        });
        // Define the schema for the tabList element
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabHeader',
            isLimit: true,
        });
        // Define the schema for the tabListItem element
        schema.register('tabListItem', {
            allowAttributes: ['class', 'data-target', 'onclick'],
            allowIn: 'tabList',
            isLimit: true,
        });
        // Define the schema for the tabListItemLabelDiv element
        schema.register('tabListItemLabelDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        // Define the schema for the tabListTable element
        schema.register('tabListTable', {
            allowAttributes: ['class'],
            allowIn: 'tabListItemLabelDiv',
            isLimit: true,
        });
        // Define the schema for the tabTitle element
        schema.register('tabTitle', {
            allowAttributes: ['class'],
            allowContentOf: '$block',
            allowIn: 'tabListTable_td',
            isLimit: true,
        });
        // Define the schema for the tabContent element
        schema.register('tabContent', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
            isLimit: true,
        });
        // Define the schema for the tabNestedContent element
        schema.register('tabNestedContent', {
            allowAttributes: ['id', 'class'],
            allowContentOf: '$root',
            allowIn: 'tabContent',
            isLimit: true,
        });
        // Prevent nesting of tabsPlugin elements inside tabNestedContent
        schema.addChildCheck((context, childDefinition) => {
            if (context.endsWith('tabNestedContent') && childDefinition.name === 'tabsPlugin') {
                return false;
            }
        });
        // Define the schema for the moveLeftButton element
        schema.register('moveLeftButton', {
            allowAttributes: ['class', 'title', 'onclick'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        // Define the schema for the moveRightButton element
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title', 'onclick'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        // Define the schema for the deleteTabButton element
        schema.register('deleteTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        // Define the schema for the deleteTabButtonParagraph element
        schema.register('deleteTabButtonParagraph', {
            allowAttributes: ['class', 'onclick'],
            allowIn: 'deleteTabButton',
            isLimit: true,
        });
        // Define the schema for the addTabListItem element
        schema.register('addTabListItem', {
            allowAttributes: ['class'],
            allowIn: 'tabList',
            isLimit: true,
        });
        // Define the schema for the addTabButton element
        schema.register('addTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabListItem',
            isLimit: true,
        });
        // Define the schema for the addTabIcon element
        schema.register('addTabIcon', {
            allowAttributes: ['class', 'onclick'],
            allowIn: 'addTabButton',
            isLimit: true,
        });
        // Define the schema for the tabListTable_thead element
        schema.register('tabListTable_thead', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        // Define the schema for the tabListTable_tr element
        schema.register('tabListTable_tr', {
            allowIn: ['tabListTable_thead', 'tabListTable_tbody'],
            isLimit: true,
        });
        // Define the schema for the tabListTable_th element
        schema.register('tabListTable_th', {
            allowIn: 'tabListTable_tr',
            isLimit: true,
        });
        // Define the schema for the tabListTable_tbody element
        schema.register('tabListTable_tbody', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        // Define the schema for the tabListTable_td element
        schema.register('tabListTable_td', {
            allowIn: 'tabListTable_tr',
            allowAttributes: ['colspan'],
            isLimit: true,
        });
    }

    // Define the converters for the tabs plugin elements
    _defineConverters() {
        const conversion = this.editor.conversion;

        // Conversion for 'tabsPlugin' element
        conversion.for('upcast').elementToElement({
            // Convert the view element to the model element and assign a unique ID
            model: (viewElement, { writer }) => {
                const uniqueId = generateId('plugin-id');
                return writer.createElement('tabsPlugin', {
                    id: uniqueId,
                    class: viewElement.getAttribute('class'),
                });
            },
            view: { name: 'div', classes: ['tabcontainer', 'yui3-widget'] },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            // Convert the model element to the view element for data downcast
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    id: modelElement.getAttribute('id'),
                    class: 'tabcontainer yui3-widget',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            // Convert the model element to the view element for editing downcast
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', {
                    id: modelElement.getAttribute('id'),
                    class: 'tabcontainer yui3-widget',
                });
                return toWidget(div, writer, { label: 'tabs plugin' });
            },
            converterPriority: 'high',
        });

        // Conversion for 'containerDiv' element
        conversion.for('upcast').elementToElement({
            model: 'containerDiv',
            view: {
                name: 'div',
                classes: [
                    'ah-tabs-horizontal',
                    'ah-responsiveselecttabs',
                    'ah-content-space-v',
                    'yui3-ah-responsiveselecttabs-content',
                    'yui3-tabview-content',
                ],
            },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'containerDiv',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content',
                }),
            converterPriority: 'high',
        });

        // Conversion for 'tabHeader' element
        conversion.for('upcast').elementToElement({
            model: 'tabHeader',
            view: { name: 'div', classes: ['tabheader', 'ah-tabs-horizontal'] },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabHeader',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'tabheader ah-tabs-horizontal',
                }),
            converterPriority: 'high',
        });

        // Conversion for 'tabList' element
        conversion.for('upcast').elementToElement({
            model: 'tabList',
            view: { name: 'ul', classes: ['tab', 'yui3-tabview-list'] },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabList',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('ul', {
                    class: 'tab yui3-tabview-list',
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });

        let tabCounter = 0; // Initialize a counter for unique IDs
        let tabContentCounter = 0; // Initialize a counter for unique IDs
        const tabIdMap = new Map(); // Map to store the relationship between tab list items and their nested content
        const tabsInstanceMap = new Map();

        // Helper function to create a 'li' element with appropriate attributes
        function createTabListItemElement(writer, element, tabContainerId) {
            let dataTarget = element.getAttribute('data-target');
            if (!dataTarget) {
                const uniqueId = `${tabContainerId}-tab-${tabCounter++}`;
                dataTarget = `#${uniqueId}`;
                writer.setAttribute('data-target', dataTarget, element);
                tabIdMap.set(uniqueId, element);
            }

            const classes = element.getAttribute('class');
            let className = classes ? `${classes} yui3-tab tablinks` : 'yui3-tab tablinks';

            // Check if this is the first tab in this tabs instance
            if (!tabsInstanceMap.has(tabContainerId) || tabsInstanceMap.get(tabContainerId).tabCount === 0) {
                className += ' active';
                if (!tabsInstanceMap.has(tabContainerId)) {
                    tabsInstanceMap.set(tabContainerId, { tabCount: 1, activeSet: true });
                } else {
                    tabsInstanceMap.get(tabContainerId).activeSet = true;
                }
            } else {
                tabsInstanceMap.get(tabContainerId).tabCount++;
            }

            return writer.createContainerElement('li', {
                class: className,
                'data-target': dataTarget,
                'data-container-id': tabContainerId,
            });
        }

        // Helper function to create a 'div' element with appropriate attributes
        function createTabNestedContentElement(writer, element, tabContainerId, isEditable = false) {
            let id = element.getAttribute('id');
            if (!id) {
                const uniqueTabContentId = `${tabContainerId}-tab-${tabContentCounter++}`;
                id = uniqueTabContentId;
                writer.setAttribute('id', id, element);
            }

            const classes = element.getAttribute('class');
            let className = classes ? `${classes} yui3-tab-panel tabcontent` : 'yui3-tab-panel tabcontent';

            // Check if this is the first content in this tabs instance
            if (tabsInstanceMap.has(tabContainerId) && tabsInstanceMap.get(tabContainerId).tabCount === 1) {
                className += ' active';
            }

            const attributes = {
                class: className,
                id: id,
                'data-container-id': tabContainerId,
            };

            if (isEditable) {
                return toWidgetEditable(writer.createEditableElement('div', attributes), writer);
            }
            return writer.createEditableElement('div', attributes);
        }

        // Conversion for 'tabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItem',
            view: {
                name: 'li',
                classes: ['yui3-tab', 'tablinks'],
            },
            converterPriority: 'high',
            // Converter function to handle the upcast conversion from view to model
            converter: (viewElement, { writer }) => {
                // Get the tabContainerId from the parent 'tabsPlugin' element
                const tabContainerElement = viewElement.findAncestor('div');
                const tabContainerId = tabContainerElement ? tabContainerElement.getAttribute('id') : 'default';
                return createTabListItemElement(writer, viewElement, tabContainerId);
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const tabContainerId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                const liElement = createTabListItemElement(writer, modelElement, tabContainerId);
                writer.setAttribute('onclick', 'parent.setActiveTab(event);', liElement);
                return liElement;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const tabContainerId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabListItemElement(writer, modelElement, tabContainerId);
            },
            converterPriority: 'high',
            converter: (modelElement, viewElement, { writer }) => {
                ensureActiveTab(writer, editor.model);
                return viewElement;
            },
        });

        // Conversion for 'tabNestedContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabNestedContent',
            view: {
                name: 'div',
                classes: ['yui3-tab-panel', 'tabcontent'],
            },
            converterPriority: 'high',
            // Converter function to handle the upcast conversion from view to model
            converter: (viewElement, { writer }) => {
                // Get the tabContainerId from the parent 'tabsPlugin' element
                const tabContainerElement = viewElement.findAncestor('div');
                const tabContainerId = tabContainerElement ? tabContainerElement.getAttribute('id') : 'default';
                return createTabNestedContentElement(writer, viewElement, tabContainerId);
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const tabContainerId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabNestedContentElement(writer, modelElement, tabContainerId);
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const tabContainerId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabNestedContentElement(writer, modelElement, tabContainerId, true);
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabListItemLabelDiv' element
        conversion.for('upcast').elementToElement({
            model: 'tabListItemLabelDiv',
            view: { name: 'div', classes: 'yui3-tab-label' },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabListItemLabelDiv',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', {
                    class: 'yui3-tab-label',
                }),
            converterPriority: 'high',
        });

        // Conversion for 'tabListTable' element
        conversion.for('upcast').elementToElement({
            model: 'tabListTable',
            view: { name: 'table' },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabListTable',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('table');
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabTitle' element
        conversion.for('upcast').elementToElement({
            model: 'tabTitle',
            view: { name: 'div', classes: 'tabTitle' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                return writer.createEditableElement('div', { class: 'tabTitle' });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                const div = writer.createEditableElement('div', { class: 'tabTitle' });
                return toWidgetEditable(div, writer);
            },
            converterPriority: 'high',
        });

        // Conversion for 'moveLeftButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveLeftButton',
            view: { name: 'div', classes: ['left-arrow', 'arrowtabicon'] },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: 'Move Tab',
                    onclick: "parent.moveTabPosition(event, 'left');",
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveLeftButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'left-arrow arrowtabicon',
                    title: 'Move Tab',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'moveRightButton' element
        conversion.for('upcast').elementToElement({
            model: 'moveRightButton',
            view: { name: 'div', classes: ['right-arrow', 'arrowtabicon'] },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: 'Move Tab',
                    onclick: "parent.moveTabPosition(event, 'right');",
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'moveRightButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'right-arrow arrowtabicon',
                    title: 'Move Tab',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'deleteTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButton',
            view: { name: 'div', classes: 'dropicon' },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'deleteTabButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'dropicon',
                    title: 'Delete Tab',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'deleteTabButtonParagraph' element
        conversion.for('upcast').elementToElement({
            model: 'deleteTabButtonParagraph',
            view: { name: 'p', classes: ['droptab', 'droptabicon'] },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'deleteTabButtonParagraph',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'droptab droptabicon',
                    onclick: 'parent.dropActiveTab(event);',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'deleteTabButtonParagraph',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'droptab droptabicon',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabListItem' element
        conversion.for('upcast').elementToElement({
            model: 'addTabListItem',
            view: { name: 'li', classes: ['yui3-tab', 'addtab'] },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'addTabListItem',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('li', {
                    class: 'yui3-tab addtab',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabButton' element
        conversion.for('upcast').elementToElement({
            model: 'addTabButton',
            view: { name: 'div', classes: 'addicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabButton',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'addicon',
                    title: 'Add Tab',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'addTabIcon' element
        conversion.for('upcast').elementToElement({
            model: 'addTabIcon',
            view: { name: 'p', classes: 'addtabicon' },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'addTabIcon',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'addtabicon',
                    onclick: 'parent.addTab(event);',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'addTabIcon',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('p', {
                    class: 'addtabicon',
                });
            },
            converterPriority: 'high',
        });

        // Conversion for 'tabContent' element
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: { name: 'div', classes: 'yui3-tabview-panel' },
            converterPriority: 'high',
        });
        conversion.for('downcast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer }) => {
                return writer.createContainerElement('div', {
                    class: 'yui3-tabview-panel',
                    draggable: false,
                });
            },
            converterPriority: 'high',
        });

        // Combined conversion for 'thead', 'tr', 'th', 'tbody', and 'td' elements
        const viewElements = ['thead', 'tr', 'th', 'tbody', 'td'];
        const modelElements = [
            'tabListTable_thead',
            'tabListTable_tr',
            'tabListTable_th',
            'tabListTable_tbody',
            'tabListTable_td',
        ];

        viewElements.forEach((viewElement, index) => {
            const modelElement = modelElements[index];
            conversion.for('upcast').elementToElement({
                model: modelElement,
                view: viewElement,
                converterPriority: 'high',
            });
            conversion.for('downcast').elementToElement({
                model: modelElement,
                view: viewElement,
                converterPriority: 'high',
            });
        });
    }
}
