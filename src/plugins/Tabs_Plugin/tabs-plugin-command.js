import { Command } from '@ckeditor/ckeditor5-core';
import { generateId, createTabsPlugin, ensureActiveTab } from './tabs-plugin-utils';

export default class TabsPluginCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            const uniqueId = generateId('plugin-id');
            const tabsPlugin = createTabsPlugin(writer, uniqueId);
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
            ensureActiveTab(writer, this.editor.model);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');

        this.isEnabled = allowedIn !== null;
    }
}
