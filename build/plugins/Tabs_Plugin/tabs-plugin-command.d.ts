export class TabsPluginCommand extends Command {
    execute(): void;
}
export class MoveTabCommand extends Command {
    execute(options: any): void;
}
export class RemoveTabCommand extends Command {
    execute(tabId: any): void;
}
import { Command } from '@ckeditor/ckeditor5-core';
