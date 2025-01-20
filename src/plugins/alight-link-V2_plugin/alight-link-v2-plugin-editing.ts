import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkv2PluginCommand from './alight-link-v2-plugin-command';

export default class AlightLinkv2PluginEditing extends Plugin {
    init() {
        const editor = this.editor;

        // Define unique content for each link option
        const linkOptionsContent = {
            linkOption1: {
                title: 'Choose a Predefined Link',
                content:
                    '<label>Link to Predefined Pages</label><input id="link-url-input" type="text" class="ck-input ck-input-text" placeholder="Enter a predefined page URL" />',
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
            editor.commands.add(commandName, new AlightLinkv2PluginCommand(editor, data));
        });
    }
}
