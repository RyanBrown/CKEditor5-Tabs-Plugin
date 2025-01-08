import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkCommand from './alight-link-plugin-command';
import { ViewElement } from '@ckeditor/ckeditor5-engine';

// This plugin handles the schema definitions and conversion rules for the 'linkHref' attribute.
export default class AlightLinkPluginEditing extends Plugin {
    // The plugin's name.
    static get pluginName() {
        return 'AlightLinkPluginEditing';
    }

    /**
     * Initializes the plugin:
     * - Extends the schema to allow 'linkHref' on text.
     * - Sets up upcast/downcast converters.
     * - Registers the 'alightLinkPlugin' command.
     */
    init() {
        const editor = this.editor;

        // Extend schema to allow 'linkHref' on text nodes
        editor.model.schema.extend('$text', {
            allowAttributes: 'linkHref',
        });

        // Define downcast converter for 'linkHref'
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

        // Define upcast converter for 'linkHref'
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

        // Register the link command
        editor.commands.add('alightLinkPlugin', new AlightLinkCommand(editor));
    }
}
