import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import { Locale } from '@ckeditor/ckeditor5-utils';
import Command from '@ckeditor/ckeditor5-core/src/command';
import type { Editor } from '@ckeditor/ckeditor5-core';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ToolBarIcon from './assets/icon-image.svg';
import './styles/alight-image-plugin.scss';

export default class AlightImagePlugin extends Plugin {
    init(): void {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('alightImagePlugin', (locale: Locale) => {
            const dropdown = createDropdown(locale);

            // Configure the dropdown button
            const buttonView = dropdown.buttonView;
            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Alight Image'),
                tooltip: true,
                withText: false,
            });

            // Create a ListView for the dropdown's panel
            const listView = new ListView(locale);

            // Override focus to prevent auto-focus on any buttons
            listView.focus = () => {
                // Do nothing to prevent focusing on items
            };

            // Add a non-clickable header
            const headerView = new View(locale);
            headerView.setTemplate({
                tag: 'div',
                attributes: {
                    class: 'dropdown-header',
                    style: 'padding: 2px 16px 4px; font-weight: 700',
                },
                children: [
                    {
                        text: t('Choose Image Type'),
                    },
                ],
            });

            // Add the header to the dropdown
            listView.items.add(headerView);

            // Add a separator after the header
            const separator = new ListSeparatorView(locale);
            listView.items.add(separator);

            const itemDefinitions = [
                { label: t('Existing Image'), command: 'imageOption1' },
                { label: t('Upload Image'), command: 'imageOption2' },
            ];

            // Populate the list view with ListItemView instances
            itemDefinitions.forEach((item) => {
                const listItem = new ListItemView(locale);

                // Create a ButtonView for each list item
                const button = new ButtonView(locale);
                button.set({
                    label: item.label,
                    withText: true,
                    tooltip: false,
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

        // Add image commands
        this._defineCommands();
    }

    private _defineCommands(): void {
        const editor = this.editor;

        editor.commands.add('imageOption1', new ImageCommand(editor, 'Option 1 executed'));
        editor.commands.add('imageOption2', new ImageCommand(editor, 'Option 2 executed'));
    }
}

class ImageCommand extends Command {
    private readonly message: string;

    constructor(editor: Editor, message: string) {
        super(editor);
        this.message = message;
    }

    override execute(): void {
        console.log(this.message);
    }
}
