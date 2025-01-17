import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import Command from '@ckeditor/ckeditor5-core/src/command';
import icon from '@ckeditor/ckeditor5-core/theme/icons/three-vertical-dots.svg';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import type { Editor } from '@ckeditor/ckeditor5-core';
import ToolBarIcon from './assets/icon-link.svg';

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

            // Add custom CSS class for vertical layout
            dropdown.panelView.extendTemplate({
                attributes: {
                    class: 'dummy-dropdown-panel',
                },
            });

            // Initialize the dropdown panel with a ViewCollection
            const panelItems = new ViewCollection();

            const itemDefinitions = [
                { label: 'Predefined Pages', command: 'dummyOption1' },
                { label: 'Public Website', command: 'dummyOption2' },
                { label: 'Intranet', command: 'dummyOption3' },
                { label: 'Existing Document', command: 'dummyOption4' },
                { label: 'New Document', command: 'dummyOption5' },
            ];

            itemDefinitions.forEach((item) => {
                const button = new ButtonView(locale);
                button.set({
                    label: item.label,
                    withText: true,
                    tooltip: true,
                });

                button.on('execute', () => {
                    editor.execute(item.command);
                    editor.editing.view.focus();
                });

                panelItems.add(button);
            });

            panelItems.forEach((item) => dropdown.panelView.children.add(item));

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
