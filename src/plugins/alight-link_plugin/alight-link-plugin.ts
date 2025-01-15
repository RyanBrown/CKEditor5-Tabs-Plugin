import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkPluginEditing from './alight-link-plugin-editing';
import AlightLinkPluginUI from './alight-link-plugin-ui';

// The main AlightLinkPlugin class that integrates editing and UI components.
export default class AlightLinkPlugin extends Plugin {
    // Specifies the plugin dependencies.
    static get requires() {
        return [AlightLinkPluginEditing, AlightLinkPluginUI];
    }

    // Plugin name for identification.
    static get pluginName() {
        return 'AlightLinkPlugin';
    }
}
