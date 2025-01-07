import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

export default class AlightLinkPluginUI extends Plugin {
    static get pluginName() {
        return 'AlightLinkPluginUI';
    }

    init(): void {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
            const buttonView = createLinkFormView(locale, editor);

            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Link'),
                tooltip: true,
                withText: true,
            });

            // Handle button click
            this.listenTo(buttonView, 'execute', () => {
                const command = editor.commands.get('alightLinkPlugin');
                const href = prompt('Enter the link URL:'); // Simplified UI
                if (href) {
                    editor.execute('alightLinkPlugin', { href });
                }
            });

            return buttonView;
        });
    }
}
