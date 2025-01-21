import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkPluginCommand from './alight-link-plugin-command';
import { getPredefinedLinksContent } from './modal-content/predefined-links';

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
                content:
                    '<label>Public Website</label><input id="link-url-input" type="text" class="ck-input ck-input-text" placeholder="Enter a public website URL" />',
            },
            linkOption3: {
                title: 'Intranet',
                content:
                    '<label>Intranet</label><input id="link-url-input" type="text" class="ck-input ck-input-text" placeholder="Enter an intranet URL" />',
            },
            linkOption4: {
                title: 'Existing Document',
                content:
                    '<label>Existing Document</label><input id="link-url-input" type="text" class="ck-input ck-input-text" placeholder="Enter an existing document URL" />',
            },
            linkOption5: {
                title: 'New Document',
                content:
                    '<label>New Document</label><input id="link-url-input" type="text" class="ck-input ck-input-text" placeholder="Enter a new document URL" />',
            },
        };

        // Register commands for each link option
        Object.entries(linkOptionsContent).forEach(([commandName, data]) => {
            editor.commands.add(commandName, new AlightLinkPluginCommand(editor, data));
        });
    }
}
