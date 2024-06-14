import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import { Widget } from '@ckeditor/ckeditor5-widget';
import { TabsPluginCommand, DeleteTabCommand, MoveTabCommand } from './tabs-plugin-command';
import { generateTabId } from './tabs-plugin-command';

export default class TabsPluginEditing extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        const editor = this.editor;
        editor.commands.add('insertTab', new TabsPluginCommand(editor));
        editor.commands.add('deleteTab', new DeleteTabCommand(editor));
        editor.commands.add('moveTab', new MoveTabCommand(editor));

        this._defineSchema();
        this._defineConverters();

        const commandsToDisable = ['link', 'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript'];

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

    // Defines the schema for the tabs plugin elements.
    _defineSchema() {
        const schema = this.editor.model.schema;

        // Define schema for the tabs plugin and its child elements
        schema.register('tabsPlugin', {
            allowAttributes: ['class'],
            allowIn: '$root',
            isLimit: true,
        });
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            isLimit: true,
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
            allowAttributes: ['class', 'data-target', 'onclick'],
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
            allowAttributes: ['id', 'class'],
            allowContentOf: '$root', // Allow all root-level content, including block elements
            allowIn: 'tabContent',
            isLimit: true,
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

    // Defines the converters for the tabs plugin elements.
    _defineConverters() {
        // Generate a unique tab ID and assign it to 'newTabId'
        const newTabId = generateTabId();

        const conversion = this.editor.conversion;

        // Conversion for 'tabsPlugin' element
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: { name: 'div', classes: ['tabcontainer', 'yui3-widget'] },
            converterPriority: 'high',
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) =>
                writer.createContainerElement('div', { class: 'tabcontainer yui3-widget' }),
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer }) => {
                const div = writer.createContainerElement('div', { class: 'tabcontainer yui3-widget' });
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

        // Conversion for 'containerDiv' element
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
                const dataTarget = viewElement.getAttribute('data-target');
                // If the 'data-target' attribute is missing, generate a new one using 'newTabId'
                if (!dataTarget) {
                    writer.setAttribute('data-target', `#${newTabId}`, viewElement);
                }
                console.log('Upcast tabListItem data-target:', viewElement.getAttribute('data-target'));
                const classes = viewElement.getAttribute('class');
                // Create a model 'li' element with the class 'tablinks' and the 'data-target' attribute
                return writer.createContainerElement('li', {
                    class: classes ? `${classes} yui3-tab tablinks` : 'yui3-tab tablinks',
                    'data-target': viewElement.getAttribute('data-target'),
                });
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                let dataTarget = modelElement.getAttribute('data-target');
                // If the 'data-target' attribute is missing, generate a new one using 'newTabId'
                if (!dataTarget) {
                    dataTarget = `#${newTabId}`;
                    writer.setAttribute('data-target', dataTarget, modelElement);
                }
                console.log('Data downcast tabListItem data-target:', dataTarget);
                const classes = modelElement.getAttribute('class');
                // Create a view 'li' element with the class 'tablinks' and the 'data-target' attribute
                return writer.createContainerElement('li', {
                    class: classes ? `${classes} yui3-tab tablinks` : 'yui3-tab tablinks',
                    'data-target': dataTarget,
                    onclick: 'parent.setActiveTab(event);',
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabListItem',
            view: (modelElement, { writer }) => {
                let dataTarget = modelElement.getAttribute('data-target');
                // If the 'data-target' attribute is missing, generate a new one using 'newTabId'
                if (!dataTarget) {
                    dataTarget = `#${newTabId}`;
                    writer.setAttribute('data-target', dataTarget, modelElement);
                }
                console.log('Editing downcast tabListItem data-target:', dataTarget);
                const classes = modelElement.getAttribute('class');
                // Create a view 'li' element with the class 'tablinks' and the 'data-target' attribute
                return writer.createContainerElement('li', {
                    class: classes ? `${classes} yui3-tab tablinks` : 'yui3-tab tablinks',
                    'data-target': dataTarget,
                });
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
                    draggable: false, // Assuming draggable is always false
                });
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
                const id = viewElement.getAttribute('id');
                // If the 'id' attribute is missing, generate a new one using 'newTabId'
                if (!id) {
                    writer.setAttribute('id', newTabId, viewElement);
                }
                console.log('Upcast tabNestedContent id:', viewElement.getAttribute('id'));
                const classes = viewElement.getAttribute('class');
                // Create a model 'div' element with the class 'tabcontent' and the 'id' attribute
                return writer.createEditableElement('div', {
                    class: classes ? `${classes} yui3-tab-panel tabcontent` : 'yui3-tab-panel tabcontent',
                    id: viewElement.getAttribute('id'),
                });
            },
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                let id = modelElement.getAttribute('id');
                // If the 'id' attribute is missing, generate a new one using 'newTabId'
                if (!id) {
                    id = newTabId;
                    writer.setAttribute('id', id, modelElement);
                }
                console.log('Data downcast tabNestedContent id:', id);
                const classes = modelElement.getAttribute('class');
                // Create a view 'div' element with the class 'tabcontent' and the 'id' attribute
                return writer.createEditableElement('div', {
                    class: classes ? `${classes} yui3-tab-panel tabcontent` : 'yui3-tab-panel tabcontent',
                    id: id,
                });
            },
            converterPriority: 'high',
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'tabNestedContent',
            view: (modelElement, { writer }) => {
                let id = modelElement.getAttribute('id');
                // If the 'id' attribute is missing, generate a new one using 'newTabId'
                if (!id) {
                    id = newTabId;
                    writer.setAttribute('id', id, modelElement);
                }
                console.log('Editing downcast tabNestedContent id:', id);
                const classes = modelElement.getAttribute('class');
                // Create a view 'div' element with the class 'tabcontent' and the 'id' attribute
                const div = writer.createEditableElement('div', {
                    class: classes ? `${classes} yui3-tab-panel tabcontent` : 'yui3-tab-panel tabcontent',
                    id: id,
                });
                // Make the 'div' element editable
                return toWidgetEditable(div, writer);
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
