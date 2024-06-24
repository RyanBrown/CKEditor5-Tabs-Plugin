export default class TabsPlugin extends Plugin {
    static get requires(): (typeof TabsPluginEditing | typeof TabsPluginUI)[];
    static get pluginName(): string;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';
