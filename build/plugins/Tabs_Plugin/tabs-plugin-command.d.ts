export function generateTabId(): string;
export class TabsPluginCommand extends Command {
    execute(): void;
}
export class MoveTabCommand extends Command {
    execute({ tabId, direction }: {
        tabId: any;
        direction: any;
    }): void;
}
export class DeleteTabCommand extends Command {
    execute(tabId: any): void;
}
import { Command } from '@ckeditor/ckeditor5-core';
