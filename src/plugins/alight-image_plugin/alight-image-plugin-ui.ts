import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ToolBarIcon from './assets/icon-image.svg';
import './styles/alight-image-plugin.scss';

export default class AlightImagePluginUI extends Plugin {
    init() {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('alightImagePlugin', (locale) => {
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

            listView.focus = () => {}; // Prevent focusing on items

            const headerView = new View(locale);
            headerView.setTemplate({
                tag: 'div',
                attributes: { class: 'dropdown-header', style: 'padding: 2px 16px 4px; font-weight: 700' },
                children: [{ text: t('Choose Image Type') }],
            });

            listView.items.add(headerView);
            listView.items.add(new ListSeparatorView(locale));

            const itemDefinitions = [
                { label: t('Predefined Pages'), command: 'imageOption1' },
                { label: t('Public Website'), command: 'imageOption2' },
            ];

            itemDefinitions.forEach((item) => {
                const listItem = new ListItemView(locale);
                const button = new ButtonView(locale);
                button.set({ label: item.label, withText: true, tooltip: false });

                button.on('execute', () => {
                    editor.execute(item.command);
                    editor.editing.view.focus();
                });

                listItem.children.add(button);
                listView.items.add(listItem);
            });

            dropdown.panelView.children.add(listView);
            return dropdown;
        });
    }
}
