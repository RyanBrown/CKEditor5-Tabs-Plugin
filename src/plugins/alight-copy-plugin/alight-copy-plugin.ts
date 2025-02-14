// src/plugins/alight-copy-plugin/alight-copy-plugin.ts
import { Editor, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import ToolBarIcon from './assets/icon-copy.svg';
import './styles/alight-copy-plugin.scss';
import AlightCopyPluginCommand from './alight-copy-plugin-command';

export default class AlightCopyPlugin extends Plugin {
  static get pluginName(): string {
    return 'AlightCopyPlugin';
  }

  constructor(editor: Editor) {
    super(editor);
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Register the AlightCopyPlugin command
    editor.commands.add('alightCopyPlugin', new AlightCopyPluginCommand(editor));

    // Add the toolbar button
    editor.ui.componentFactory.add('alightCopyPlugin', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('Copy with Styles'),
        icon: ToolBarIcon,
        tooltip: true
      });

      // Bind button state to command state
      const command = editor.commands.get('alightCopyPlugin');
      if (command) {
        button.bind('isEnabled').to(command);
      }

      // Execute command on button click
      button.on('execute', () => {
        editor.execute('alightCopyPlugin');
      });

      return button;
    });
  }
}
