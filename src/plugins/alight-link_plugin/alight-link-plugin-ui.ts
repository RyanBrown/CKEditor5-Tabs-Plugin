import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView, createPublicWebsiteLink, createIntranetLink } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-plugin.css';
import { AlightModal, ModalProps } from '../alight-modal/alight-modal';

export default class AlightLinkPluginUI extends Plugin {
    static get pluginName() {
        return 'AlightLinkPluginUI';
    }

    private static activeModal: AlightModal | null = null;

    public init(): void {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
            const buttonView = createLinkFormView(locale, editor);

            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Alight Link'),
                tooltip: true,
                withText: false,
            });

            this.listenTo(buttonView, 'execute', () => {
                const customDiv = document.createElement('div');
                customDiv.innerHTML = `
                    <ul class="choose-link-list">
                        <li>Alight Worklife Pages</li>
                        <li><a>Predefined Pages</a></li>
                    </ul>
                    <ul class="choose-link-list">
                        <li>External Sites</li>
                        <li><a>Public Website</a></li>
                        <li><a>Intranet</a></li>
                    </ul>
                    <ul class="choose-link-list">
                        <li>Documents</li>
                        <li><a>Existing Document</a></li>
                        <li><a>New Document</a></li>
                    </ul>
                `;
                this.openAlightModal({
                    title: 'Choose a Link',
                    mainContent: customDiv,
                    primaryBtnLabel: 'OK',
                    tertiaryBtnLabel: 'Close',
                    showHeader: true,
                    showFooter: false,
                });

                customDiv.querySelectorAll('a').forEach((link) => {
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        const linkText = link.textContent?.trim() || '';
                        this.handleLinkClick(linkText);
                    });
                });
            });

            return buttonView;
        });
    }

    private openAlightModal(props?: ModalProps): Promise<unknown> {
        // Close the previously open modal (if any)
        if (AlightLinkPluginUI.activeModal) {
            AlightLinkPluginUI.activeModal.close();
        }

        // Create a new modal and store it as the active modal
        const modal = new AlightModal();
        AlightLinkPluginUI.activeModal = modal;

        // When this modal closes (resolve or reject), clear the active modal reference
        return modal.openModal(props).finally(() => {
            AlightLinkPluginUI.activeModal = null;
        });
    }

    /**
     * Handles clicks from the link selection list in the "Choose a Link" modal.
     * Based on which link type the user chooses, it displays another modal
     * with relevant content.
     *
     * @param linkText - The text associated with the clicked link
     */
    private handleLinkClick(linkText: string): void {
        let modalProps: ModalProps;

        switch (linkText) {
            case 'Predefined Pages':
                modalProps = {
                    title: 'Choose a Predefined Link',
                    mainContent: `<p>predefined link content goes here...</p>`,
                    // width: '500px',
                    // className: 'predefined-modal',
                    // primaryBtnLabel: 'Select',
                    // tertiaryBtnLabel: 'Close',
                    // showHeader: true,
                    // showFooter: true,
                };
                break;
            case 'Public Website':
                modalProps = {
                    title: 'Public Website',
                    mainContent: createPublicWebsiteLink(),
                };
                break;
            case 'Intranet':
                modalProps = {
                    title: 'Intranet',
                    mainContent: createIntranetLink(),
                };
                break;
            case 'Existing Document':
                modalProps = {
                    title: 'Existing Document',
                    mainContent: `<p>existing document content goes here...</p>`,
                    width: '60rem',
                };
                break;
            case 'New Document':
                modalProps = {
                    title: 'New Document',
                    mainContent: `<p>new document to link to content goes here...</p>`,
                };
                break;
            default:
                modalProps = {
                    title: 'Unknown Link',
                    mainContent: `<p>No content found for "${linkText}".</p>`,
                };
                break;
        }

        this.openAlightModal(modalProps);
    }
}
