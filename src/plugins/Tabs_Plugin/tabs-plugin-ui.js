import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import './styles/tabs-plugin.css';

// Plugin to handle the UI for the tabs plugin.
export default class TabsPluginUI extends Plugin {
    // Initializes the plugin.
    init() {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const command = editor.commands.get('tabsPlugin');
            const buttonView = new ButtonView(locale);

            buttonView.set({
                icon: '<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m23.1 1.6c-.2-.2-.5-.4-.8-.5-.3-.1-.6-.2-1-.2h-18.5c-.4 0-.7.1-1 .2-.4.1-.6.3-.9.5-.5.5-.9 1.3-.9 2.1v16.6c0 1.5 1.2 2.8 2.8 2.8h18.5c1.5 0 2.8-1.2 2.8-2.8v-16.6c-.1-.8-.5-1.6-1-2.1zm-9.3 1.2c.5 0 .9.4.9.9v3.7h-5.5v-3.7c0-.5.4-.9.9-.9zm8.4 17.5c0 .5-.4.9-.9.9h-18.5c-.5 0-.9-.4-.9-.9v-16.6c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v5.5h14.8zm-5.6-12.9v-3.7c0-.5.4-.9.9-.9h3.7c.5 0 .9.4.9.9v3.7z" fill="#333333"/></svg>',
                label: 'Insert Tabs',
                tooltip: true,
                withText: false,
            });

            buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

            this.listenTo(buttonView, 'execute', () => {
                editor.execute('tabsPlugin');
                editor.editing.view.focus();
            });

            return buttonView;
        });
    }
}
