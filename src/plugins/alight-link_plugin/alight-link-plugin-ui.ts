import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If your bundler supports direct CSS imports, uncomment below:
// import './styles/alight-link-plugin.css';

// Import your modal, LinkData, and the new ModalProps interface
import { CustomModal, LinkData, ModalProps } from '../alight-modal/alight-modal';

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
                // Grab the link command (if you need to execute after collecting data)
                const command = editor.commands.get('alightLinkPlugin');

                // ------------------------------------------
                // EXAMPLE #1: Use the default link fields (no props)
                // ------------------------------------------
                this.openCustomModal().then((linkData: LinkData | null) => {
                    if (linkData) {
                        const { href, target, rel } = linkData;
                        // Execute the command with the retrieved properties
                        editor.execute('alightLinkPlugin', { href, target, rel });
                    }
                });

                // ------------------------------------------
                // EXAMPLE #2: Pass custom title & button labels (still uses default link fields)
                // ------------------------------------------
                // this.openCustomModal({
                //     title: 'My Custom Title',
                //     primaryBtnLabel: 'OK',
                //     secondaryBtnLabel: 'Close',
                // }).then((linkData: LinkData | null) => {
                //     if (linkData) {
                //         const { href, target, rel } = linkData;
                //         editor.execute('alightLinkPlugin', { href, target, rel });
                //     }
                // });

                // ------------------------------------------
                // EXAMPLE #3: Provide a completely custom main content (no link fields)
                // ------------------------------------------

                // // 1) Create a custom div or element to insert into the <main> of the modal
                // const customDiv = document.createElement('div');
                // customDiv.innerHTML = `
                //     <p>Hello, world!</p>
                //     <p>This is a fully custom main section.</p>
                // `;

                // // 2) Pass custom props, including mainContent
                // this.openCustomModal({
                //     title: 'Custom Content',
                //     mainContent: customDiv,
                //     primaryBtnLabel: 'Got it',
                //     secondaryBtnLabel: 'Dismiss',
                // }).then((linkData: LinkData | null) => {
                //     // In this scenario, the default code resolves with null
                //     // unless you add logic to read from customDiv in the modal’s "Continue" handler.
                //     if (linkData) {
                //         // Typically will be null with the default "custom content" logic
                //         console.log('Closed with data:', linkData);
                //     } else {
                //         console.log('Modal canceled or custom content returned null.');
                //     }
                // });
            });

            return buttonView;
        });
    }

    /**
     * Opens the custom modal, returning a Promise<LinkData | null>.
     * Accepts optional props to customize title, main content, and button labels.
     */
    private openCustomModal(props?: ModalProps): Promise<LinkData | null> {
        const modal = new CustomModal();
        return modal.openModal(props);
    }
}
