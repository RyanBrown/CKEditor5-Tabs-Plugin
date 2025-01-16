import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView, createPublicWebsiteLink, createIntranetLink } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-plugin.css';
import { AlightModal, ModalProps } from '../alight-modal/alight-modal';
import { getPredefinedLinksContent } from './modal-content/predefined-links';

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
        if (AlightLinkPluginUI.activeModal) {
            AlightLinkPluginUI.activeModal.close();
        }
        const modal = new AlightModal();
        AlightLinkPluginUI.activeModal = modal;

        return modal.openModal(props).finally(() => {
            AlightLinkPluginUI.activeModal = null;
        });
    }

    private handleLinkClick(linkText: string): void {
        let modalProps: ModalProps;

        switch (linkText) {
            case 'Predefined Pages':
                modalProps = {
                    title: 'Choose a Predefined Link',
                    mainContent: getPredefinedLinksContent(), // Use imported content generator
                    // width: '500px',
                    // className: 'predefined-modal',
                    mainClassName: 'predefined-links-container',
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
