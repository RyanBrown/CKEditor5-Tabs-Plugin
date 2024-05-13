import Command from '@ckeditor/ckeditor5-core/src/command';

export default class TabsCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            // Create a new tabs element with some default content
            const tabs = writer.createElement('tabs');
            const tab = writer.createElement('tab', { title: 'Tab 1' });
            const tabContent = writer.createElement('tabContent');

            writer.append(tab, tabs);
            writer.append(tabContent, tab);
            writer.insertText('Tab content goes here...', tabContent);

            // Insert the tabs at the current model selection
            this.editor.model.insertContent(tabs);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        this.isEnabled = model.schema.checkChild(selection.focus.parent, 'tabs');
    }
}
