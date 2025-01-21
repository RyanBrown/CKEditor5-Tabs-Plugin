import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkPluginCommand from './alight-link-plugin-command';
import { getPredefinedLinksContent } from './modal-content/predefined-links';
import { getPublicWebsiteLinksContent } from './modal-content/public-website-links';
import { getIntranetLinksContent } from './modal-content/intranet-links';
import { getExistingDocumentLinksContent } from './modal-content/existing-documents-links';
import { getNewDocumentsLinksContent } from './modal-content/new-documents-links';
import './styles/predefined-links.scss';
import './styles/search.scss';

export default class AlightLinkPluginEditing extends Plugin {
    init() {
        const editor = this.editor;

        // Define unique content for each link option
        const linkOptionsContent = {
            linkOption1: {
                title: 'Choose a Predefined Link',
                content: '<div class="predefined-links-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getPredefinedLinksContent(1, 10);
                },
            },
            linkOption2: {
                title: 'Public Website',
                content: '<div class="public-website-links-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getPublicWebsiteLinksContent();
                },
            },
            linkOption3: {
                title: 'Intranet',
                content: '<div class="intranet-links-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getIntranetLinksContent();
                },
            },
            linkOption4: {
                title: 'Existing Document',
                content: '<div class="existing-documents-links-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getExistingDocumentLinksContent();
                },
            },
            linkOption5: {
                title: 'New Document',
                content: '<div class="new-documents-links-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getNewDocumentsLinksContent();
                },
            },
        };

        // Register commands for each link option
        Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
            editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
        });
    }
}
