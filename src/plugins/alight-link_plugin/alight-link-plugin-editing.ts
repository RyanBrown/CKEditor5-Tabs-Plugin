import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkCommand from './alight-link-plugin-command';
import { linkAttributes } from './alight-link-plugin-utils';
import { ViewElement } from '@ckeditor/ckeditor5-engine'; // For defining `ViewElement` type
import { UpcastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/upcastdispatcher';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';

// AlightLinkPluginEditing handles schema extensions and data conversion for links.
export default class AlightLinkPluginEditing extends Plugin {
    // Plugin name for identification.
    static get pluginName() {
        return 'AlightLinkPluginEditing';
    }

    // Initializes the plugin:
    // - Extends the schema to allow link attributes.
    // - Registers upcast and downcast converters.
    // - Adds the link command.
    init(): void {
        const editor = this.editor;

        // Extend schema to allow link attributes on text nodes.
        editor.model.schema.extend('$text', {
            allowAttributes: Object.values(linkAttributes),
        });

        // Register converters for all link attributes.
        Object.entries(linkAttributes).forEach(([key, modelAttr]) => {
            // Downcast converters: model -> view.
            editor.conversion.for('downcast').attributeToElement({
                model: {
                    name: '$text',
                    key: modelAttr,
                },
                view: (attrValue: string | undefined, { writer }): any => {
                    if (!attrValue) return null;
                    return (viewElement: ViewElement, conversionApi: DowncastConversionApi) => {
                        if (viewElement.name === 'a') {
                            conversionApi.writer.setAttribute(key, attrValue, viewElement);
                        }
                    };
                },
            });

            // Upcast converters: view -> model.
            editor.conversion.for('upcast').elementToAttribute({
                view: {
                    name: 'a',
                    attributes: { [key]: true },
                },
                model: {
                    key: modelAttr,
                    value: (viewElement: ViewElement, conversionApi: UpcastConversionApi) => {
                        return viewElement.getAttribute(key);
                    },
                },
            });
        });

        // Register the link command.
        editor.commands.add('alightLinkPlugin', new AlightLinkCommand(editor));
    }
}
