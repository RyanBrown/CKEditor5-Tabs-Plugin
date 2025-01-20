import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkv2PluginUI from './alight-link-v2-plugin-ui';
import AlightLinkv2PluginEditing from './alight-link-v2-plugin-editing';

export default class AlightLinkv2Plugin extends Plugin {
    static get requires() {
        return [AlightLinkv2PluginUI, AlightLinkv2PluginEditing];
    }

    static get pluginName() {
        return 'AlightLinkv2Plugin';
    }
}
