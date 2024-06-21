export default class TabsPlugin extends Plugin {
    static get requires(): (typeof Widget | typeof TabsPluginEditing | typeof TabsPluginUI)[];
    static get pluginName(): string;
    init(): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget } from '@ckeditor/ckeditor5-widget';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';
