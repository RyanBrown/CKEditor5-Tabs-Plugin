import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkPluginEditing from './alight-link-plugin-editing';
import AlightLinkPluginUI from './alight-link-plugin-ui';

export default class AlightLinkPlugin extends Plugin {
    static get requires() {
        return [AlightLinkPluginEditing, AlightLinkPluginUI];
    }

    static get pluginName() {
        return 'AlightLinkPlugin';
    }
}
