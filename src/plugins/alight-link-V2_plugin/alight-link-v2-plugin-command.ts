import Command from '@ckeditor/ckeditor5-core/src/command';
import type { Editor } from '@ckeditor/ckeditor5-core';

export default class AlightLinkv2PluginCommand extends Command {
    private readonly message: string;

    constructor(editor: Editor, message: string) {
        super(editor);
        this.message = message;
    }

    override execute(): void {
        console.log(this.message);
    }
}
