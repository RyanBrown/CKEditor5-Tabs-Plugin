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

        // Initialize commands
        editor.commands.add('deleteTab', new DeleteTabCommand(editor));
        editor.commands.add('moveTab', new MoveTabCommand(editor));
        editor.commands.add('tabsPlugin', new TabsPluginCommand(editor));

        this._ensureTabIds();
        this._defineSchema();
        this._defineConverters();

        // Handle changes and updates in tabs
        this.editor.model.document.on('change', () => {
            this.editor.model.change((writer) => {
                ensureActiveTab(writer, this.editor.model);
            });
        });

        this.editor.model.document.on('change:data', () => {
            this._ensureTabIds();
        });
        // Add paste handler for tabTitle to strip formatting
        this._addPasteHandlerForTabTitle();
    }

    // Ensure that each tab has a unique ID and the associated tab content has a corresponding 'data-target' attribute
    _ensureTabIds() {
        const editor = this.editor; // Get reference to the editor instance
        const model = editor.model; // Get the model of the editor

        model.change((writer) => {
            const root = model.document.getRoot(); // Get the root of the document
            // Find all 'tabsPlugin' elements in the document to ensure their structure
            const tabsPlugins = findAllDescendants(root, (node) => node.is('element', 'tabsPlugin'));

            // Iterate through each found 'tabsPlugin' element
            tabsPlugins.forEach((tabsPlugin) => {
                const containerDiv = tabsPlugin.getChild(0); // Get the first child (container div) of the 'tabsPlugin'
                if (!containerDiv) return; // If containerDiv is not found, exit

                const tabHeader = containerDiv.getChild(0); // Get the tab header which contains the tab list
                const tabContent = containerDiv.getChild(1); // Get the tab content that holds the content of each tab
                if (!tabHeader || !tabContent) return; // Exit if either tab header or tab content is not found

                const tabList = tabHeader.getChild(0); // Get the first child of tabHeader which is the list of tabs
                if (!tabList) return; // Exit if tabList is not found

                // Get all 'tabListItem' elements from the tab list
                const tabListItems = Array.from(tabList.getChildren()).filter((child) =>
                    child.is('element', 'tabListItem')
                );
                // Get all 'tabNestedContent' elements from the tab content container
                const tabNestedContents = Array.from(tabContent.getChildren()).filter((child) =>
                    child.is('element', 'tabNestedContent')
                );

                // Iterate through each tabListItem and its corresponding tabNestedContent
                tabListItems.forEach((tabListItem, index) => {
                    const tabNestedContent = tabNestedContents[index]; // Match the tab content with its respective tab
                    if (!tabListItem || !tabNestedContent) return; // If either is missing, skip this iteration

                    // Get the 'data-target' attribute from the tab list item and 'id' from the tab content
                    const dataTarget = tabListItem.getAttribute('data-target');
                    const contentId = tabNestedContent.getAttribute('id');

                    // Check if either 'data-target' or 'id' is missing, or if they do not match
                    if (!dataTarget || !contentId || dataTarget !== `#${contentId}`) {
                        // Generate a new unique ID for the tab
                        const newId = generateId('tab-id');
                        // Set 'data-target' on the tab list item to reference the newly generated ID
                        writer.setAttribute('data-target', `#${newId}`, tabListItem);
                        // Set 'id' on the tab content to match the new ID
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
            allowAttributes: ['class', 'data-target'],
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
            allowAttributes: ['class', 'style'],
            allowChildren: '$text',
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
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        // Define the schema for the moveRightButton element
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title'],
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
            allowAttributes: ['class'],
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
            allowAttributes: ['class'],
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
        function createTabListItemElement(writer, element, tabPluginId) {
            let dataTarget = element.getAttribute('data-target');
            if (!dataTarget) {
                const uniqueId = `${tabPluginId}-tab-${tabCounter++}`;
                dataTarget = `#${uniqueId}`;
                writer.setAttribute('data-target', dataTarget, element);
                tabIdMap.set(uniqueId, element);
            }

            const classes = element.getAttribute('class');
            let className = classes ? `${classes} yui3-tab tablinks` : 'yui3-tab tablinks';

            // Check if this is the first tab in this tabs instance
            if (!tabsInstanceMap.has(tabPluginId) || tabsInstanceMap.get(tabPluginId).tabCount === 0) {
                className += ' active';
                if (!tabsInstanceMap.has(tabPluginId)) {
                    tabsInstanceMap.set(tabPluginId, { tabCount: 1, activeSet: true });
                } else {
                    tabsInstanceMap.get(tabPluginId).activeSet = true;
                }
            } else {
                tabsInstanceMap.get(tabPluginId).tabCount++;
            }

            return writer.createContainerElement('li', {
                class: className,
                'data-target': dataTarget,
                'data-plugin-id': tabPluginId,
            });
        }

        // Helper function to create a 'div' element with appropriate attributes
        function createTabNestedContentElement(writer, element, tabPluginId, isEditable = false) {
            let id = element.getAttribute('id');
            if (!id) {
                const uniqueTabContentId = `${tabPluginId}-tab-${tabContentCounter++}`;
                id = uniqueTabContentId;
                writer.setAttribute('id', id, element);
            }

            const classes = element.getAttribute('class');
            let className = classes ? `${classes} yui3-tab-panel tabcontent` : 'yui3-tab-panel tabcontent';

            // Check if this is the first content in this tabs instance
            if (tabsInstanceMap.has(tabPluginId) && tabsInstanceMap.get(tabPluginId).tabCount === 1) {
                className += ' active';
            }

            const attributes = {
                class: className,
                id: id,
                'data-plugin-id': tabPluginId,
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
                // Get the tabPluginId from the parent 'tabsPlugin' element
                const tabContainerElement = viewElement.findAncestor('div');
                const tabPluginId = tabContainerElement ? tabContainerElement.getAttribute('id') : 'default';
                return createTabListItemElement(writer, viewElement, tabPluginId);
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const tabPluginId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                const liElement = createTabListItemElement(writer, modelElement, tabPluginId);
                return liElement;
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                const tabPluginId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabListItemElement(writer, modelElement, tabPluginId);
            },
            converterPriority: 'high',
            converter: (modelElement, viewElement, { writer }) => {
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
                // Get the tabPluginId from the parent 'tabsPlugin' element
                const tabContainerElement = viewElement.findAncestor('div');
                const tabPluginId = tabContainerElement ? tabContainerElement.getAttribute('id') : 'default';
                return createTabNestedContentElement(writer, viewElement, tabPluginId);
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const tabPluginId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabNestedContentElement(writer, modelElement, tabPluginId);
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                const tabPluginId = modelElement.findAncestor('tabsPlugin').getAttribute('id');
                return createTabNestedContentElement(writer, modelElement, tabPluginId, true);
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
            converter: (viewElement, { writer }) => {
                // Ensure that the model element is created with the display:flex style
                const style = viewElement.getStyle('display') || 'flex';
                return writer.createElement('tabTitle', { style: `display:${style}` });
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                // Ensure that the view element is rendered with the display:flex style
                const style = modelElement.getAttribute('style') || 'display:flex';
                return writer.createEditableElement('div', { class: 'tabTitle', style: style });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabTitle',
            view: (modelElement, { writer }) => {
                // Ensure that the view element is rendered with the display:flex style for editing
                const style = modelElement.getAttribute('style') || 'display:flex';
                const div = writer.createEditableElement('div', { class: 'tabTitle', style: style });
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

    // Adds a paste handler for the tabTitle element to strip all formatting when pasting text
    _addPasteHandlerForTabTitle() {
        const editor = this.editor;

        // Listen for clipboard input events (pasting) on the view document
        editor.editing.view.document.on('clipboardInput', (evt, data) => {
            const target = data.target;

            // Check if the paste target is a tabTitle element
            if (target && target.hasClass && target.hasClass('tabTitle')) {
                const dataTransfer = data.dataTransfer;
                // Retrieve the plain text from the clipboard data
                const plainText = dataTransfer.getData('text/plain');

                // Prevent the default paste action to avoid inserting formatted content
                if (typeof evt.stop === 'function') {
                    evt.stop();
                }
                if (typeof data.preventDefault === 'function') {
                    data.preventDefault();
                }
                // Insert the plain text into the tabTitle element
                editor.model.change((writer) => {
                    // Get the current selection in the model.
                    const selection = editor.model.document.selection;
                    // Remove any existing content in the selection range
                    const range = selection.getFirstRange();
                    writer.remove(range);

                    // Insert the plain text at the current selection range
                    writer.insertText(plainText, range.start);
                });
            }
        });
    }
}
