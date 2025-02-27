// src/plugins/alight-paste-plugin/alight-paste-plugin.ts
import { Editor, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import ToolBarIcon from './../../../theme/icons/icon-paste.svg';
import AlightPastePluginCommand from './alight-paste-plugin-command';

export default class AlightPastePlugin extends Plugin {
  static get pluginName(): string {
    return 'AlightPastePlugin';
  }

  constructor(editor: Editor) {
    super(editor);
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Register the paste command
    editor.commands.add('alightPastePlugin', new AlightPastePluginCommand(editor));

    // Add the toolbar button
    editor.ui.componentFactory.add('alightPastePlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('Paste with Styles'),
        icon: ToolBarIcon,
        tooltip: true
      });

      // Execute command on button click
      button.on('execute', () => {
        editor.execute('alightPastePlugin');
      });

      return button;
    });
  }
}
