import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import TabsPluginCommand from './tabs-plugin-command';
import { generateId } from './tabs-plugin-utils';

export default class TabsPluginEditing extends Plugin {
    static get pluginName() {
        return 'TabsPluginEditing';
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add('tabsPlugin', new TabsPluginCommand(this.editor));
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('tabsPlugin', {
            allowAttributes: ['class', 'id'],
            isObject: true,
            allowWhere: '$block',
        });
        // Prevent nesting of tabsPlugin
        schema.addChildCheck((context, childDefinition) => {
            if (childDefinition.name === 'tabsPlugin' && context.endsWith('tabsPlugin')) {
                return false;
            }
        });
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            // allowContentOf: '$root', // This allows any content that's allowed in the root
        });
        schema.register('tabHeader', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
            isLimit: true,
        });
        schema.register('tabList', {
            allowAttributes: ['class'],
            allowIn: 'tabHeader',
            isLimit: true,
        });
        schema.register('tabListItem', {
            allowAttributes: ['class', 'data-target', 'onclick', 'data-plugin-id'],
            allowIn: 'tabList',
            isLimit: true,
        });
        schema.register('tabListItemLabelDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabListItem',
            isLimit: true,
        });
        schema.register('tabListTable', {
            allowAttributes: ['class'],
            allowIn: 'tabListItemLabelDiv',
            isLimit: true,
        });
        schema.register('tabTitle', {
            allowAttributes: ['class'],
            allowContentOf: '$block',
            allowIn: 'tabListTable_td',
            isLimit: true,
        });
        schema.register('tabContent', {
            allowAttributes: ['class'],
            allowIn: 'containerDiv',
            isLimit: true,
        });
        schema.register('tabNestedContent', {
            allowAttributes: ['id', 'class', 'data-plugin-id'],
            allowContentOf: '$root',
            allowIn: 'tabContent',
            isLimit: true,
        });
        // Add this line to prevent tabsPlugin inside tabNestedContent
        schema.addChildCheck((context, childDefinition) => {
            if (context.endsWith('tabNestedContent') && childDefinition.name === 'tabsPlugin') {
                return false;
            }
        });
        schema.register('moveLeftButton', {
            allowAttributes: ['class', 'title', 'onclick'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('moveRightButton', {
            allowAttributes: ['class', 'title', 'onclick'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('deleteTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'tabListTable_th',
            isLimit: true,
        });
        schema.register('deleteTabButtonParagraph', {
            allowAttributes: ['class', 'onclick'],
            allowIn: 'deleteTabButton',
            isLimit: true,
        });
        schema.register('addTabListItem', {
            allowAttributes: ['class'],
            allowIn: 'tabList',
            isLimit: true,
        });
        schema.register('addTabButton', {
            allowAttributes: ['class', 'title'],
            allowIn: 'addTabListItem',
            isLimit: true,
        });
        schema.register('addTabIcon', {
            allowAttributes: ['class', 'onclick'],
            allowIn: 'addTabButton',
            isLimit: true,
        });
        schema.register('tabListTable_thead', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        schema.register('tabListTable_tr', {
            allowIn: ['tabListTable_thead', 'tabListTable_tbody'],
            isLimit: true,
        });
        schema.register('tabListTable_th', {
            allowIn: 'tabListTable_tr',
            isLimit: true,
        });
        schema.register('tabListTable_tbody', {
            allowIn: 'tabListTable',
            isLimit: true,
        });
        schema.register('tabListTable_td', {
            allowIn: 'tabListTable_tr',
            allowAttributes: ['colspan'],
            isLimit: true,
        });
    }

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
        let firstTabActive = false; // Flag to track if any tab is active
        let firstContentActive = false; // Flag to track if any content is active

        // Helper function to create a 'li' element with appropriate attributes
        function createTabListItemElement(writer, element, tabContainerId) {
            let dataTarget = element.getAttribute('data-target');
            if (!dataTarget) {
                const uniqueId = `${tabContainerId}-tab-${tabCounter++}`;
                dataTarget = `#${uniqueId}`;
                writer.setAttribute('data-target', dataTarget, element);
                tabIdMap.set(uniqueId, element); // Store the mapping
            }
            console.log('TabListItem data-target:', dataTarget);

            const classes = element.getAttribute('class') || '';
            let className = `${classes} yui3-tab tablinks`.trim();

            // Check if this tab has 'active' class
            if (className.includes('active')) {
                firstTabActive = true;
            }

            // If it's the first tab and no tab is active yet, add 'active' class
            if (tabCounter === 1 && !firstTabActive) {
                className += ' active';
                firstTabActive = true;
            }

            return writer.createContainerElement('li', {
                class: className,
                'data-target': dataTarget,
                'data-plugin-id': tabContainerId,
            });
        }

        // Helper function to create a 'div' element with appropriate attributes
        function createTabNestedContentElement(writer, element, tabContainerId, isEditable = false) {
            let id = element.getAttribute('id');
            if (!id) {
                const uniqueTabContentId = `${tabContainerId}-tab-${tabContentCounter++}`;
                id = `${uniqueTabContentId}`;
                writer.setAttribute('id', id, element);
            }

            console.log('TabNestedContent id:', id);

            const classes = element.getAttribute('class') || '';
            let className = `${classes} yui3-tab-panel tabcontent`.trim();

            // Check if this content has 'active' class
            if (className.includes('active')) {
                firstContentActive = true;
            }

            // If it's the first tab content and no content is active yet, add 'active' class
            if (tabContentCounter === 1 && !firstContentActive) {
                className += ' active';
                firstContentActive = true;
            }

            const attributes = {
                class: className,
                id: id,
                'data-plugin-id': tabContainerId,
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
