import { Plugin } from '@ckeditor/ckeditor5-core';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';

// The main TabsPlugin class.
// This class extends the CKEditor 5 Plugin class and serves as the entry point for the Tabs plugin.
export default class TabsPlugin extends Plugin {
    // Defines the plugin dependencies.
    // The Tabs plugin requires the TabsPluginEditing and TabsPluginUI plugins.
    // @returns {Array} An array of required plugins.
    static get requires() {
        return [TabsPluginEditing, TabsPluginUI];
    }
}
