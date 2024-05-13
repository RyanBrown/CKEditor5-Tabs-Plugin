import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TabsCommand from './tabs-plugin-command';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';

export default class TabsPluginEditing extends Plugin {
    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add('insertTabs', new TabsCommand(this.editor));
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
        schema.register('tabs', {
            isObject: true,
            allowWhere: '$block',
            allowContentOf: '$block',
        });

        schema.register('tab', {
            isLimit: true,
            allowIn: 'tabs',
            allowContentOf: '$block',
        });

        schema.register('tabContent', {
            isLimit: true,
            allowIn: 'tab',
            allowContentOf: '$block',
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for('upcast').elementToElement({
            model: 'tabs',
            view: {
                name: 'div',
                classes: 'tabs',
            },
        });

        conversion.for('upcast').elementToElement({
            model: 'tab',
            view: {
                name: 'div',
                classes: 'tab',
            },
        });

        conversion.for('downcast').elementToElement({
            model: 'tabs',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', { class: 'tabs' });
            },
        });

        conversion.for('downcast').elementToElement({
            model: 'tab',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', { class: 'tab' });
            },
        });
    }
}
