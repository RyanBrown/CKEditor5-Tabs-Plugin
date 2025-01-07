import { Command } from '@ckeditor/ckeditor5-core';
export default class AlightLinkCommand extends Command {
    execute({ href }: {
        href: string;
    }): void;
    refresh(): void;
}
