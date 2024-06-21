export default class TabsPlugin extends Plugin {
    static get requires(): (typeof TabsPluginUI)[];
    static get pluginName(): string;
}
import { Plugin } from 'ckeditor5/src/core';
import TabsPluginUI from './tabs-plugin-ui';
