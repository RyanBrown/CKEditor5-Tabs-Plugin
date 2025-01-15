import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import {
    createLinkFormView,
    createPublicWebsiteLink,
    createIntranetLink,
    extractLinkData,
} from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-link-plugin.css';
import { CustomModal, ModalProps } from '../alight-modal/alight-modal';

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

                this.openCustomModal({
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

    private openCustomModal(props?: ModalProps): Promise<unknown> {
        const modal = new CustomModal();
        return modal.openModal(props);
    }

    private handleLinkClick(linkText: string): void {
        let modalTitle = linkText;
        let mainContentHtml: string | HTMLElement;

        switch (linkText) {
            case 'Predefined Pages':
                modalTitle = 'Choose a Predefined Link';
                mainContentHtml = `<p>predefined link content goes here...</p>`;
                break;
            case 'Public Website':
                modalTitle = 'Public Website';
                mainContentHtml = createPublicWebsiteLink();
                break;
            case 'Intranet':
                modalTitle = 'Intranet';
                mainContentHtml = createIntranetLink();
                break;
            case 'Existing Document':
                modalTitle = 'Existing Document';
                mainContentHtml = `<p>existing document content goes here...</p>`;
                break;
            case 'New Document':
                modalTitle = 'New Document';
                mainContentHtml = `<p>new document to link to content goes here...</p>`;
                break;
            default:
                modalTitle = 'Unknown Link';
                mainContentHtml = `<p>No content found for "${linkText}".</p>`;
                break;
        }

        this.openCustomModal({
            title: modalTitle,
            mainContent: mainContentHtml,
            primaryBtnLabel: 'OK',
            tertiaryBtnLabel: 'Cancel',
            showHeader: true,
            showFooter: true,
        });
    }
}
