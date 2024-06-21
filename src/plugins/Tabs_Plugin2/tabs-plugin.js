import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget } from '@ckeditor/ckeditor5-widget';
import { TabsPluginCommand } from './tabs-plugin-command';
import TabsPluginEditing from './tabs-plugin-editing';
import TabsPluginUI from './tabs-plugin-ui';

// Main TabsPlugin class extending CKEditor 5 Plugin class
export default class TabsPlugin extends Plugin {
    // Plugin dependencies
    static get requires() {
        return [Widget, TabsPluginEditing, TabsPluginUI];
    }

    static get pluginName() {
        return 'TabsPlugin';
    }

    init() {
        const editor = this.editor;
        editor.commands.add('tabsPlugin', new TabsPluginCommand(editor));
    }
}
