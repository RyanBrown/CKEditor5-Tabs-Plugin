import { Command } from '@ckeditor/ckeditor5-core';
import { generateId, createTabsPlugin, ensureActiveTab } from './tabs-plugin-utils';

// Define a command for the tabs plugin
export default class TabsPluginCommand extends Command {
    // Execute the command
    execute() {
        // Make a change to the editor model
        this.editor.model.change((writer) => {
            // Generate a unique ID for the plugin instance
            const uniqueId = generateId('plugin-id');
            // Create the tabs plugin element
            const tabsPlugin = createTabsPlugin(writer, uniqueId);
            // Insert the tabs plugin element into the editor
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
            // Ensure the first tab is active by default
            ensureActiveTab(writer, this.editor.model);
        });
    }

    // Refresh the command state
    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        // Check if the tabsPlugin element is allowed at the current selection position
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');
        this.isEnabled = allowedIn !== null;
    }
}
