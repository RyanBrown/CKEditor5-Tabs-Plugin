import { Plugin } from '@ckeditor/ckeditor5-core';
export default class AlightLinkPluginEditing extends Plugin {
    static get pluginName(): string;
    /**
     * Initializes the plugin:
     * - Extends the schema to allow 'linkHref' on text.
     * - Sets up upcast/downcast converters.
     * - Registers the 'alightLinkPlugin' command.
     */
    init(): void;
}
