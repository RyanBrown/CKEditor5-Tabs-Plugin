export class TabsPluginCommand extends Command {
    execute(): void;
}
export class AddTabCommand extends Command {
    execute({ pluginId }: {
        pluginId: any;
    }): void;
}
export class MoveTabCommand extends Command {
    execute({ tabId, direction }: {
        tabId: any;
        direction: any;
    }): void;
}
export class DeleteTabCommand extends Command {
    execute({ tabId, pluginId }: {
        tabId: any;
        pluginId: any;
    }): void;
}
import { Command } from '@ckeditor/ckeditor5-core';
