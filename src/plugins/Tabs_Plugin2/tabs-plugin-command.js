import { Command } from '@ckeditor/ckeditor5-core';

export default class TabsPluginCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            const tabsPlugin = createTabsPlugin(writer);
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
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
    const tabsPlugin = writer.createElement('tabsPlugin');
    const containerDiv = writer.createElement('containerDiv');

    writer.append(containerDiv, tabsPlugin);

    // You may want to add some default content here
    // For example:
    const paragraph = writer.createElement('paragraph');
    writer.append(paragraph, containerDiv);
    writer.appendText('Tab content goes here', paragraph);

    return tabsPlugin;
}
