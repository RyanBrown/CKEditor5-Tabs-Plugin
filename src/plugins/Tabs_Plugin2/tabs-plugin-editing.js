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
        schema.register('containerDiv', {
            allowAttributes: ['class'],
            allowIn: 'tabsPlugin',
            allowContentOf: '$root', // This allows any content that's allowed in the root
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
    }
}
