// src/plugins/alight-custom-modal-link-plugin/alight-custom-modal-link-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import { AlightCustomModalLinkPluginCommand } from './alight-custom-modal-link-plugin-command';

export class AlightCustomModalLinkPluginEditing extends Plugin {
  public static get requires() {
    return [LinkEditing];
  }

  public static get pluginName() {
    return 'AlightCustomModalLinkPluginEditing';
  }

  public init(): void {
    // console.log('AlightCustomModalLinkPluginEditing#init()');

    // If you only want to rely on the built-in 'link' command, you can skip adding your own command.
    this.editor.commands.add('alightCustomLinkPlugin', new AlightCustomModalLinkPluginCommand(this.editor));
  }
}
