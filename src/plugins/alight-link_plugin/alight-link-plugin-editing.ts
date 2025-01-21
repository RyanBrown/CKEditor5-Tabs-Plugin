import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkPluginCommand from './alight-link-plugin-command';
import { getPredefinedLinkContent } from './modal-content/predefined-link';
import { getPublicWebsiteLinkContent } from './modal-content/public-website-link';
import { getIntranetLinkContent } from './modal-content/intranet-link';
import { getExistingDocumentLinkContent } from './modal-content/existing-document-link';
import { getNewDocumentsLinkContent } from './modal-content/new-document-link';

export default class AlightLinkPluginEditing extends Plugin {
    init() {
        const editor = this.editor;

        // Define unique content for each link option
        const linkOptionsContent = {
            linkOption1: {
                title: 'Choose a Predefined Link',
                content: '<div class="predefined-link-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getPredefinedLinkContent(1, 10);
                },
            },
            linkOption2: {
                title: 'Public Website',
                content: '<div class="public-website-link-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getPublicWebsiteLinkContent();
                },
            },
            linkOption3: {
                title: 'Intranet',
                content: '<div class="intranet-link-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getIntranetLinkContent();
                },
            },
            linkOption4: {
                title: 'Existing Document',
                content: '<div class="existing-document-link-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getExistingDocumentLinkContent();
                },
            },
            linkOption5: {
                title: 'New Document',
                content: '<div class="new-document-link-container"></div>', // Placeholder container for dynamic content
                loadContent: async () => {
                    // Dynamically load and return the content
                    return getNewDocumentsLinkContent();
                },
            },
        };

        // Register commands for each link option
        Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
            editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
        });
    }
}
