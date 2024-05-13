import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';

export default class TabsPlugin extends Plugin {
    static get requires() {
        return [TabsPluginEditing, TabsPluginUI];
    }

    static get pluginName() {
        return 'TabsPlugin';
    }
}
