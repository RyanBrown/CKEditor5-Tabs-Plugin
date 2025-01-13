import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If your bundler supports direct CSS imports, uncomment below:
import './styles/alight-link-plugin.css';

// Import your modal + interface
import { CustomModal, LinkData } from './alight-modal';

export default class AlightLinkPluginUI extends Plugin {
    static get pluginName() {
        return 'AlightLinkPluginUI';
    }

    init(): void {
        const editor = this.editor;
        const t = editor.t;

        // Add the UI button for link insertion
        editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
            // Create the basic button view
            const buttonView = createLinkFormView(locale, editor);

            // Configure the button with icon, label, and tooltip
            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Link'),
                tooltip: true,
                withText: true,
            });

            // Handle button click
            this.listenTo(buttonView, 'execute', () => {
                const command = editor.commands.get('alightLinkPlugin');

                // Open our custom modal (vanilla TypeScript)
                this.openCustomModal().then((linkData: LinkData | null) => {
                    if (linkData) {
                        const { href, target, rel } = linkData;
                        // Execute the command with the retrieved properties
                        editor.execute('alightLinkPlugin', { href, target, rel });
                    }
                });
            });

            return buttonView;
        });
    }

    // Opens the custom modal, returning a Promise of LinkData or null.
    private openCustomModal(): Promise<LinkData | null> {
        const modal = new CustomModal();
        return modal.openModal();
    }
}
