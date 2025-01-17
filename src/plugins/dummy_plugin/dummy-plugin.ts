import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ToolBarIcon from './assets/icon-link.svg';
import type { Editor } from '@ckeditor/ckeditor5-core';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export default class DummyPlugin extends Plugin {
    static get pluginName(): string {
        return 'DummyPlugin';
    }

    init(): void {
        const editor = this.editor;

        // Add the dropdown button to the editor toolbar
        editor.ui.componentFactory.add('dummyPlugin', (locale) => {
            const dropdown = createDropdown(locale);

            // Configure the dropdown button
            const buttonView = dropdown.buttonView;
            buttonView.set({
                icon: ToolBarIcon,
                label: 'Insert Alight Link',
                tooltip: true,
                withText: false,
            });

            // Create a ListView for the dropdown's panel
            const listView = new ListView(locale);

            const itemDefinitions = [
                { label: 'Predefined Pages', command: 'dummyOption1' },
                { label: 'Public Website', command: 'dummyOption2' },
                { label: 'Intranet', command: 'dummyOption3' },
                { label: 'Existing Document', command: 'dummyOption4' },
                { label: 'New Document', command: 'dummyOption5' },
            ];

            // Populate the list view with ListItemView instances
            itemDefinitions.forEach((item) => {
                const listItem = new ListItemView(locale);

                // Create a ButtonView for each list item
                const button = new ButtonView(locale);
                button.set({
                    label: item.label,
                    withText: true,
                    tooltip: true,
                });

                // Handle the execute event for the button
                button.on('execute', () => {
                    editor.execute(item.command);
                    editor.editing.view.focus();
                });

                // Add the ButtonView to the ListItemView's children
                listItem.children.add(button);

                // Add the ListItemView to the ListView
                listView.items.add(listItem);
            });

            // Add the ListView to the dropdown's panel
            dropdown.panelView.children.add(listView);

            return dropdown;
        });

        // Add dummy commands
        this._defineCommands();
    }

    private _defineCommands(): void {
        const editor = this.editor;

        editor.commands.add('dummyOption1', new DummyCommand(editor, 'Option 1 executed'));
        editor.commands.add('dummyOption2', new DummyCommand(editor, 'Option 2 executed'));
        editor.commands.add('dummyOption3', new DummyCommand(editor, 'Option 3 executed'));
        editor.commands.add('dummyOption4', new DummyCommand(editor, 'Option 4 executed'));
        editor.commands.add('dummyOption5', new DummyCommand(editor, 'Option 5 executed'));
    }
}

class DummyCommand extends Command {
    private readonly message: string;

    constructor(editor: Editor, message: string) {
        super(editor);
        this.message = message;
    }

    override execute(): void {
        console.log(this.message);
    }
}
