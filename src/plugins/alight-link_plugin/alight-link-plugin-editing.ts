import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkCommand from './alight-link-plugin-command';
import { linkAttributes } from './alight-link-plugin-utils';
import { ViewElement } from '@ckeditor/ckeditor5-engine';

export default class AlightLinkPluginEditing extends Plugin {
    static get pluginName() {
        return 'AlightLinkPluginEditing';
    }

    init() {
        const editor = this.editor;

        // Extend schema
        editor.model.schema.extend('$text', {
            allowAttributes: 'linkHref',
        });

        // Define converters
        editor.conversion.for('downcast').attributeToElement({
            model: 'linkHref',
            view: (attributeValue: string) => {
                if (!attributeValue) return;
                return {
                    name: 'a',
                    attributes: {
                        href: attributeValue,
                    },
                };
            },
        });

        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    href: true,
                },
            },
            model: {
                key: 'linkHref',
                value: (viewElement: ViewElement) => viewElement.getAttribute('href'),
            },
        });

        // Register the command
        editor.commands.add('alightLinkPlugin', new AlightLinkCommand(editor));
    }
}
