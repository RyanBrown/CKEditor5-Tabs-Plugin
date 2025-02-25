// src/plugins/alight-tabs-plugin/alight-tabs-plugin-editing.js
import { Plugin } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import AlightTabsPluginCommand, { AddTabCommand, DeleteTabCommand, MoveTabCommand, SetActiveTabCommand } from './alight-tabs-plugin-command';
import { generatePluginId, ensureFirstTabActive, tabsPluginMap } from './alight-tabs-plugin-utils';

export default class AlightTabsPluginEditing extends Plugin {
  static get pluginName() {
    return 'AlightTabsPluginEditing';
  }

  // Initializes the AlightTabsPluginEditing by registering commands and defining schema/converters.
  init() {
    const editor = this.editor;

    // Register custom commands for tabs functionality.
    editor.commands.add('addTab', new AddTabCommand(editor));
    editor.commands.add('deleteTab', new DeleteTabCommand(editor));
    editor.commands.add('moveTab', new MoveTabCommand(editor));
    editor.commands.add('setActiveTab', new SetActiveTabCommand(editor));
    editor.commands.add('alightTabsPlugin', new AlightTabsPluginCommand(editor));

    this._defineSchema();
    this._defineConverters();

    // Ensure the first tab is active
    editor.model.document.on('change:data', () => {
      ensureFirstTabActive(editor);
    });

    // Post-initialization check to verify and assign data attributes
    editor.model.document.on('change:data', () => {
      verifyAndAssignDataAttributes(editor);
    });

    const rootChildren = editor.model.document.getRoot().getChildren();
    for (let i = 0; i < rootChildren.length; i++) {
      const child = rootChildren[i];
      if (child.is('element', 'alightTabsPlugin')) {
        const pluginId = child.getAttribute('data-plugin-id');
        if (pluginId) {
          tabsPluginMap.set(pluginId, child);
        }
      }
    }

    // Add a custom paste handler
    this._addPasteHandlerForTabTitle();
  }

  // Define the schema for the tabs plugin elements
  _defineSchema() {
    const schema = this.editor.model.schema;

    // Register different elements and their allowed attributes/parents.
    schema.register('alightTabsPlugin', { allowAttributes: ['class', 'id', 'data-plugin-id'], allowWhere: '$block', isObject: true });
    schema.register('containerDiv', { allowAttributes: ['class'], allowIn: 'alightTabsPlugin' });
    schema.register('tabHeader', { allowAttributes: ['class'], allowIn: 'containerDiv', isLimit: true });
    schema.register('tabList', { allowAttributes: ['class'], allowIn: 'tabHeader', isLimit: true });
    schema.register('tabListItem', { allowAttributes: ['class', 'data-index', 'data-plugin-id', 'isActive'], allowIn: 'tabList', isLimit: true });
    schema.register('tabListItemLabelDiv', { allowAttributes: ['class'], allowIn: 'tabListItem', isLimit: true });
    schema.register('tabListTable', { allowAttributes: ['class'], allowIn: 'tabListItemLabelDiv', isLimit: true });
    schema.register('tabTitle', { allowAttributes: ['class', 'style'], allowChildren: '$text', allowIn: 'tabListTable_td', isLimit: true });
    schema.register('tabContent', { allowAttributes: ['class'], allowIn: 'containerDiv', isLimit: true });
    schema.register('tabNestedContent', { allowAttributes: ['class', 'data-index', 'isActive'], allowContentOf: '$root', allowIn: 'tabContent', isLimit: true });
    schema.register('moveLeftButton', { allowAttributes: ['class', 'title', 'data-index', 'data-plugin-id'], allowIn: 'tabListTable_th', isLimit: true });
    schema.register('moveRightButton', { allowAttributes: ['class', 'title', 'data-index', 'data-plugin-id'], allowIn: 'tabListTable_th', isLimit: true });
    schema.register('deleteTabButton', { allowAttributes: ['class', 'title', 'data-index', 'data-plugin-id'], allowIn: 'tabListTable_th', isLimit: true });
    schema.register('deleteTabButtonParagraph', { allowAttributes: ['class'], allowIn: 'deleteTabButton', isLimit: true });
    schema.register('addTabListItem', { allowAttributes: ['class'], allowIn: 'tabList', isLimit: true });
    schema.register('addTabButton', { allowAttributes: ['class', 'title', 'data-plugin-id'], allowIn: 'addTabListItem', isLimit: true });
    schema.register('addTabIcon', { allowAttributes: ['class'], allowIn: 'addTabButton', isLimit: true });
    schema.register('tabListTable_thead', { allowIn: 'tabListTable', isLimit: true });
    schema.register('tabListTable_tr', { allowIn: ['tabListTable_thead', 'tabListTable_tbody'], isLimit: true });
    schema.register('tabListTable_th', { allowIn: 'tabListTable_tr', isLimit: true });
    schema.register('tabListTable_tbody', { allowIn: 'tabListTable', isLimit: true });
    schema.register('tabListTable_td', { allowIn: 'tabListTable_tr', allowAttributes: ['colspan'], isLimit: true });

    // Prevent nesting of certain elements.
    schema.addChildCheck((context, childDefinition) => {
      if (childDefinition.name === 'alightTabsPlugin' && context.endsWith('alightTabsPlugin')) return false;
      if (context.endsWith('tabNestedContent') && childDefinition.name === 'alightTabsPlugin') return false;
    });
  }

  // Define the converters for the tabs plugin elements.
  _defineConverters() {
    const conversion = this.editor.conversion;

    // Conversion for 'alightTabsPlugin' element.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        // Extract or generate pluginId
        let pluginId = viewElement.getAttribute('data-plugin-id');
        if (!pluginId) {
          pluginId = generatePluginId();
        }
        const clearStyle = viewElement.getStyle('clear') || 'both';
        const displayStyle = viewElement.getStyle('display') || 'block';
        const widthStyle = viewElement.getStyle('width') || '100%';
        const combinedStyle = `clear:${clearStyle}; display:${displayStyle}; width:${widthStyle}`;
        return writer.createElement('alightTabsPlugin', { 'data-plugin-id': pluginId, style: combinedStyle });
      },
      view: { name: 'div', classes: ['tabcontainer', 'yui3-widget'] },
      converterPriority: 'high',
    });
    conversion.for('dataDowncast').elementToElement({
      model: 'alightTabsPlugin',
      view: (modelElement, { writer }) => {
        const pluginId = modelElement.getAttribute('data-plugin-id') || generatePluginId();
        const style = modelElement.getAttribute('style') || 'clear: both; display: block; width: 100%';
        return writer.createContainerElement('div', { class: 'tabcontainer yui3-widget', 'data-plugin-id': pluginId, style: style });
      },
      converterPriority: 'high',
    });
    conversion.for('editingDowncast').elementToElement({
      model: 'alightTabsPlugin',
      view: (modelElement, { writer }) => {
        const pluginId = modelElement.getAttribute('data-plugin-id') || generatePluginId();
        const style = modelElement.getAttribute('style') || 'clear: both; display: block; width: 100%';
        const div = writer.createContainerElement('div', { class: 'tabcontainer yui3-widget', 'data-plugin-id': pluginId, style: style });
        return toWidget(div, writer, { label: 'tabs plugin' });
      },
      converterPriority: 'high',
    });

    // Conversion for 'containerDiv' element.
    conversion.for('upcast').elementToElement({
      model: 'containerDiv',
      view: { name: 'div', classes: ['ah-tabs-horizontal', 'ah-responsiveselecttabs', 'ah-content-space-v', 'yui3-ah-responsiveselecttabs-content', 'yui3-tabview-content'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'containerDiv',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'ah-tabs-horizontal ah-responsiveselecttabs ah-content-space-v yui3-ah-responsiveselecttabs-content yui3-tabview-content' }),
      converterPriority: 'high',
    });

    // Conversion for 'tabHeader' element.
    conversion.for('upcast').elementToElement({
      model: 'tabHeader',
      view: { name: 'div', classes: ['tabheader', 'ah-tabs-horizontal'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabHeader',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'tabheader ah-tabs-horizontal' }),
      converterPriority: 'high',
    });

    // Conversion for 'tabList' element.
    conversion.for('upcast').elementToElement({
      model: 'tabList',
      view: { name: 'ul', classes: ['tab', 'yui3-tabview-list'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabList',
      view: (modelElement, { writer }) => writer.createContainerElement('ul', { class: 'tab yui3-tabview-list' }),
      converterPriority: 'high',
    });

    // Conversion for 'tabListItem' element.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        // Extract or generate pluginId
        let pluginId = viewElement.getAttribute('data-plugin-id');
        if (!pluginId || pluginId === 'undefined' || pluginId === 'null') {
          pluginId = null; // Or simply leave it undefined
        }
        // Extract or compute dataIndex
        let dataIndex = viewElement.getAttribute('data-index');
        if (dataIndex === undefined || dataIndex === null) {
          const parent = viewElement.parent;
          const children = Array.from(parent.getChildren()).filter((child) => child.is('element', 'li'));
          dataIndex = children.indexOf(viewElement) || 0;
        }
        // Determine if the tab is active
        const isActive = viewElement.hasClass('active');

        // Create attributes object, only include 'data-plugin-id' if it's not null
        const attributes = { 'data-index': dataIndex, isActive };
        if (pluginId) {
          attributes['data-plugin-id'] = pluginId;
        }
        return writer.createElement('tabListItem', attributes);
      },
      view: { name: 'li', classes: ['yui3-tab', 'tablinks'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabListItem',
      view: (modelElement, { writer }) => {
        const classes = ['yui3-tab', 'tablinks'];
        if (modelElement.getAttribute('isActive')) {
          classes.push('active');
        }
        return writer.createContainerElement('li', { class: classes.join(' '), 'data-index': modelElement.getAttribute('data-index'), 'data-plugin-id': modelElement.getAttribute('data-plugin-id') });
      },
      converterPriority: 'high',
    });
    // Attribute downcast converter for 'isActive' on 'tabListItem'.
    conversion.for('downcast').add((dispatcher) => {
      dispatcher.on('attribute:isActive:tabListItem', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);
        if (!viewElement) {
          return;
        }
        if (data.attributeNewValue) {
          viewWriter.addClass('active', viewElement);
        } else {
          viewWriter.removeClass('active', viewElement);
        }
      });
    });

    // Conversion for 'tabNestedContent' element.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        // Extract or compute data-index
        let dataIndex = viewElement.getAttribute('data-index');
        if (dataIndex === undefined || dataIndex === null) {
          // Find the position of this tabNestedContent within its parent
          const parent = viewElement.parent;
          const children = Array.from(parent.getChildren()).filter((child) => child.is('element', 'div') && child.hasClass('yui3-tab-panel'));
          dataIndex = children.indexOf(viewElement) || 0;
        }
        // Extract or inherit pluginId
        let pluginId = viewElement.getAttribute('data-plugin-id');
        if (!pluginId || pluginId === 'undefined') {
          pluginId = null; // Leave it null; we'll assign it later
        }
        const isActive = viewElement.hasClass('active');
        const attributes = { 'data-index': dataIndex, isActive };

        if (pluginId) {
          attributes['data-plugin-id'] = pluginId;
        }
        return writer.createElement('tabNestedContent', attributes);
      },
      view: { name: 'div', classes: ['yui3-tab-panel', 'tabcontent'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabNestedContent',
      view: (modelElement, { writer }) => {
        const classes = ['yui3-tab-panel', 'tabcontent'];
        if (modelElement.getAttribute('isActive')) {
          classes.push('active');
        }
        const editableDiv = writer.createEditableElement('div', { class: classes.join(' '), 'data-index': modelElement.getAttribute('data-index') });
        return toWidgetEditable(editableDiv, writer);
      },
      converterPriority: 'high',
    });
    // Attribute downcast converter for 'isActive' on 'tabNestedContent'.
    conversion.for('downcast').add((dispatcher) => {
      dispatcher.on('attribute:isActive:tabNestedContent', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (!viewElement) {
          return;
        }
        if (data.attributeNewValue) {
          viewWriter.addClass('active', viewElement);
        } else {
          viewWriter.removeClass('active', viewElement);
        }
      });
    });

    // Conversion for 'tabListItemLabelDiv' element.
    conversion.for('upcast').elementToElement({
      model: 'tabListItemLabelDiv',
      view: { name: 'div', classes: 'yui3-tab-label' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabListItemLabelDiv',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'yui3-tab-label' }),
      converterPriority: 'high',
    });

    // Conversion for 'tabListTable' element.
    conversion.for('upcast').elementToElement({
      model: 'tabListTable',
      view: { name: 'table' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabListTable',
      view: (modelElement, { writer }) => writer.createContainerElement('table'),
      converterPriority: 'high',
    });

    // Conversion for 'tabTitle' element.
    conversion.for('upcast').elementToElement({
      model: 'tabTitle',
      view: { name: 'div', classes: 'tabTitle' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabTitle',
      view: (modelElement, { writer }) => {
        const div = writer.createEditableElement('div', { class: 'tabTitle' });
        return toWidgetEditable(div, writer);
      },
      converterPriority: 'high',
    });

    // Conversion for 'moveLeftButton' element.
    conversion.for('upcast').elementToElement({
      model: 'moveLeftButton',
      view: { name: 'div', classes: ['left-arrow', 'arrowtabicon'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'moveLeftButton',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'left-arrow arrowtabicon', title: 'Move Tab Left', 'data-index': modelElement.getAttribute('data-index'), 'data-plugin-id': modelElement.getAttribute('data-plugin-id') }),
      converterPriority: 'high',
    });

    // Conversion for 'moveRightButton' element.
    conversion.for('upcast').elementToElement({
      model: 'moveRightButton',
      view: { name: 'div', classes: ['right-arrow', 'arrowtabicon'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'moveRightButton',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'right-arrow arrowtabicon', title: 'Move Tab Right', 'data-index': modelElement.getAttribute('data-index'), 'data-plugin-id': modelElement.getAttribute('data-plugin-id') }),
      converterPriority: 'high',
    });

    // Conversion for 'deleteTabButton' element.
    conversion.for('upcast').elementToElement({
      model: 'deleteTabButton',
      view: { name: 'div', classes: 'dropicon' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'deleteTabButton',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'dropicon', title: 'Delete Tab', 'data-index': modelElement.getAttribute('data-index'), 'data-plugin-id': modelElement.getAttribute('data-plugin-id') }),
      converterPriority: 'high',
    });

    // Conversion for 'deleteTabButtonParagraph' element.
    conversion.for('upcast').elementToElement({
      model: 'deleteTabButtonParagraph',
      view: { name: 'p', classes: ['droptab', 'droptabicon'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'deleteTabButtonParagraph',
      view: (modelElement, { writer }) => writer.createContainerElement('p', { class: 'droptab droptabicon' }),
      converterPriority: 'high',
    });

    // Conversion for 'addTabListItem' element.
    conversion.for('upcast').elementToElement({
      model: 'addTabListItem',
      view: { name: 'li', classes: ['yui3-tab', 'addtab'] },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'addTabListItem',
      view: (modelElement, { writer }) => writer.createContainerElement('li', { class: 'yui3-tab addtab' }),
      converterPriority: 'high',
    });

    // Conversion for 'addTabButton' element.
    conversion.for('upcast').elementToElement({
      model: (viewElement, { writer }) => {
        // Find the closest ancestor with a plugin ID (the alightTabsPlugin).
        const parentPlugin = viewElement.findAncestor((ancestor) => ancestor.hasAttribute('data-plugin-id'));
        const pluginId = parentPlugin?.getAttribute('data-plugin-id') || generatePluginId();

        // Create the model element with the inherited or new pluginId.
        return writer.createElement('addTabButton', { 'data-plugin-id': pluginId });
      },
      view: { name: 'div', classes: 'addicon' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'addTabButton',
      view: (modelElement, { writer }) => {
        const pluginId = modelElement.getAttribute('data-plugin-id') || generatePluginId();
        return writer.createContainerElement('div', { class: 'addicon', title: 'Add Tab', 'data-plugin-id': pluginId });
      },
      converterPriority: 'high',
    });

    // Conversion for 'addTabIcon' element.
    conversion.for('upcast').elementToElement({
      model: 'addTabIcon',
      view: { name: 'p', classes: 'addtabicon' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'addTabIcon',
      view: (modelElement, { writer }) => writer.createContainerElement('p', { class: 'addtabicon' }),
      converterPriority: 'high',
    });

    // Conversion for 'tabContent' element.
    conversion.for('upcast').elementToElement({
      model: 'tabContent',
      view: { name: 'div', classes: 'yui3-tabview-panel' },
      converterPriority: 'high',
    });
    conversion.for('downcast').elementToElement({
      model: 'tabContent',
      view: (modelElement, { writer }) => writer.createContainerElement('div', { class: 'yui3-tabview-panel' }),
      converterPriority: 'high',
    });

    // Combined conversion for 'thead', 'tr', 'th', 'tbody', and 'td' elements.
    const viewElements = ['thead', 'tr', 'th', 'tbody', 'td'];
    const modelElements = ['tabListTable_thead', 'tabListTable_tr', 'tabListTable_th', 'tabListTable_tbody', 'tabListTable_td'];

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

  // Adds a custom paste handler for pasting plain text into tab titles.
  _addPasteHandlerForTabTitle() {
    const editor = this.editor;

    editor.editing.view.document.on('clipboardInput', (evt, data) => {
      const target = data.target;

      // Check if the paste target is a tab title.
      if (target && target.hasClass && target.hasClass('tabTitle')) {
        const dataTransfer = data.dataTransfer;
        const plainText = dataTransfer.getData('text/plain');

        // Prevent the default paste behavior.
        if (typeof evt.stop === 'function') {
          evt.stop();
        }
        if (typeof data.preventDefault === 'function') {
          data.preventDefault();
        }

        // Insert the plain text into the tab title.
        editor.model.change((writer) => {
          const selection = editor.model.document.selection;
          const range = selection.getFirstRange();
          writer.remove(range);
          writer.insertText(plainText, range.start);
        });
      }
    });
  }
}

// Ensures that all alightTabsPlugin instances have valid data-index and data-plugin-id attributes.
function verifyAndAssignDataAttributes(editor) {
  const model = editor.model;

  model.change((writer) => {
    const tabsPlugins = Array.from(model.document.getRoot().getChildren()).filter((element) => element.is('element', 'alightTabsPlugin'));

    tabsPlugins.forEach((alightTabsPlugin) => {
      let pluginId = alightTabsPlugin.getAttribute('data-plugin-id');
      if (!pluginId) {
        pluginId = generatePluginId();
        writer.setAttribute('data-plugin-id', pluginId, alightTabsPlugin);
      }

      tabsPluginMap.set(pluginId, alightTabsPlugin); // Ensure all plugins are mapped correctly

      const containerDiv = alightTabsPlugin.getChild(0);
      const tabList = containerDiv?.getChild(0)?.getChild(0);
      const tabContentContainer = containerDiv?.getChild(1);

      if (!tabList || !tabContentContainer) {
        console.warn('verifyAndAssignDataAttributes: Invalid alightTabsPlugin structure.');
        return;
      }

      Array.from(tabList.getChildren()).forEach((tabListItem) => {
        writer.setAttribute('data-plugin-id', pluginId, tabListItem);
      });

      Array.from(tabContentContainer.getChildren()).forEach((tabContent) => {
        writer.setAttribute('data-plugin-id', pluginId, tabContent);
      });

      // Ensure the addTabButton inside addTabListItem gets the pluginId
      const addTabListItem = Array.from(tabList.getChildren()).find((child) => child.is('element', 'addTabListItem'));
      if (addTabListItem) {
        const addTabButton = addTabListItem.getChild(0); // Assuming the first child is addTabButton
        if (addTabButton) {
          writer.setAttribute('data-plugin-id', pluginId, addTabButton);
        }
      }
    });
  });
}
