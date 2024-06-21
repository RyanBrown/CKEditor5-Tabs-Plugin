import { Command } from '@ckeditor/ckeditor5-core';

export default class TabsPluginCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            this.editor.model.insertContent(createTabsPlugin(writer));
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');

        this.isEnabled = allowedIn !== null;
    }
}

function createTabsPlugin(writer) {
    const tabsContainer = writer.createElement('tabsContainer');
    const tabTitle = writer.createElement('tabTitle');
    const tabContent = writer.createElement('tabContent');

    writer.append(tabTitle, tabsContainer);
    writer.append(tabContent, tabsContainer);

    // You may want to add some default content here

    return tabsContainer;
}
