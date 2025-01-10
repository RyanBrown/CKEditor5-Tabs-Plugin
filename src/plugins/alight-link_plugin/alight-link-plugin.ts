/* ===================================
 * File: alight-link-plugin.ts
 * Description: Bundles the Editing and UI sub-plugins.
 * =================================== */

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkPluginEditing from './alight-link-plugin-editing';
import AlightLinkPluginUI from './alight-link-plugin-ui';

export default class AlightLinkPlugin extends Plugin {
    // Dependencies on the editing and UI plugins for links.
    static get requires() {
        return [AlightLinkPluginEditing, AlightLinkPluginUI];
    }

    // The plugin name.
    static get pluginName() {
        return 'AlightLinkPlugin';
    }
}
