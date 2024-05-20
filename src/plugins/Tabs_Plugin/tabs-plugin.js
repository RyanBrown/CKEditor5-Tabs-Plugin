import { Plugin } from '@ckeditor/ckeditor5-core';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';

// Main TabsPlugin class extending CKEditor 5 Plugin class
export default class TabsPlugin extends Plugin {
    // Plugin dependencies
    static get requires() {
        return [TabsPluginEditing, TabsPluginUI];
    }
}
