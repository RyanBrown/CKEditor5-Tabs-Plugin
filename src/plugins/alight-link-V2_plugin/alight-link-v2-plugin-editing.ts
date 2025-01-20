import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AlightLinkv2PluginCommand from './alight-link-v2-plugin-command';

export default class AlightLinkv2PluginEditing extends Plugin {
    init() {
        const editor = this.editor;

        editor.commands.add('linkOption1', new AlightLinkv2PluginCommand(editor, 'linkOption1'));
        editor.commands.add('linkOption2', new AlightLinkv2PluginCommand(editor, 'linkOption2'));
        editor.commands.add('linkOption3', new AlightLinkv2PluginCommand(editor, 'linkOption3'));
        editor.commands.add('linkOption4', new AlightLinkv2PluginCommand(editor, 'linkOption4'));
        editor.commands.add('linkOption5', new AlightLinkv2PluginCommand(editor, 'linkOption5'));
    }
}
