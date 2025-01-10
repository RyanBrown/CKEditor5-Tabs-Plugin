import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkCommand from './alight-link-plugin-command';

// We need these imports for properly typing the downcast converters:
import { ViewElement } from '@ckeditor/ckeditor5-engine';
// For downcast converters:
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
// For upcast converters:
import { UpcastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/upcastdispatcher';

export default class AlightLinkPluginEditing extends Plugin {
    // The plugin's name.
    static get pluginName() {
        return 'AlightLinkPluginEditing';
    }

    /**
     * Initializes the plugin:
     * - Extends the schema to allow multiple link attributes on text.
     * - Sets up upcast/downcast converters.
     * - Registers the 'alightLinkPlugin' command.
     */
    init() {
        const editor = this.editor;

        // Extend schema to allow link attributes on text nodes
        editor.model.schema.extend('$text', {
            allowAttributes: ['linkHref', 'linkTarget', 'linkRel'],
        });

        /**
         * Downcast Converters
         *
         * If the text has linkHref, we create an <a> element with href.
         * Then we conditionally add target/rel if they exist.
         */
        editor.conversion.for('downcast').attributeToElement({
            model: {
                name: '$text',
                key: 'linkHref',
            },
            // attributeValue -> string, { writer } -> an object with writer
            view: (hrefValue: string, { writer }) => {
                if (!hrefValue) return;
                return writer.createAttributeElement('a', { href: hrefValue }, { priority: 5 });
            },
        });

        editor.conversion.for('downcast').attributeToElement({
            model: {
                name: '$text',
                key: 'linkTarget',
            },
            /**
             * When a "value" (targetValue) is present in the model, we return a function that
             * receives (viewElement, conversionApi). We must type them explicitly to avoid TS7006.
             */
            view: (targetValue: string, { writer }) => {
                if (!targetValue) return;
                return (viewElement: ViewElement, conversionApi: DowncastConversionApi) => {
                    if (viewElement.name === 'a') {
                        conversionApi.writer.setAttribute('target', targetValue, viewElement);
                    }
                };
            },
        });

        editor.conversion.for('downcast').attributeToElement({
            model: {
                name: '$text',
                key: 'linkRel',
            },
            view: (relValue: string, { writer }) => {
                if (!relValue) return;
                return (viewElement: ViewElement, conversionApi: DowncastConversionApi) => {
                    if (viewElement.name === 'a') {
                        conversionApi.writer.setAttribute('rel', relValue, viewElement);
                    }
                };
            },
        });

        /**
         * Upcast Converters
         *
         * If we see an <a> element in the HTML, grab href, target, rel
         * and set them in the model as linkHref, linkTarget, linkRel.
         */
        editor.conversion.for('upcast').elementToAttribute({
            view: 'a',
            model: {
                key: 'linkHref',
                // The callback type can be typed with UpcastConversionApi if needed.
                value: (viewElement: ViewElement /*, conversionApi: UpcastConversionApi */) => {
                    return viewElement.getAttribute('href');
                },
            },
        });

        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    target: true,
                },
            },
            model: {
                key: 'linkTarget',
                value: (viewElement: ViewElement /*, conversionApi: UpcastConversionApi */) => {
                    return viewElement.getAttribute('target');
                },
            },
        });

        editor.conversion.for('upcast').elementToAttribute({
            view: {
                name: 'a',
                attributes: {
                    rel: true,
                },
            },
            model: {
                key: 'linkRel',
                value: (viewElement: ViewElement /*, conversionApi: UpcastConversionApi */) => {
                    return viewElement.getAttribute('rel');
                },
            },
        });

        // Register the link command
        editor.commands.add('alightLinkPlugin', new AlightLinkCommand(editor));
    }
}
