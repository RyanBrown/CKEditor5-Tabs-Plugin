import { Command } from '@ckeditor/ckeditor5-core';
export default class AlightLinkCommand extends Command {
    /**
     * Executes the command.
     * If an href is provided, the command sets the 'linkHref' attribute in the model range.
     * If no href is provided, the command removes the 'linkHref' attribute from the selection range.
     */
    execute({ href }: {
        href: string;
    }): void;
    /**
     * Refreshes the command state.
     * - isEnabled: checks if there is a non-collapsed selection.
     * - value: stores the current link URL if the selection has a 'linkHref' attribute.
     */
    refresh(): void;
}
