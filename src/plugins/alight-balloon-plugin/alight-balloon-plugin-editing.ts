// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin-editing.ts

/**
 * alight-custom-link-plugin-editing.ts
 *
 * The editing portion of our plugin:
 *  - Brings in LinkEditing (link schema, data converters).
 *  - Optionally registers our custom "alightLink" command.
 */

import { Plugin } from '@ckeditor/ckeditor5-core';
import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';
import { AlightBalloonPluginCommand } from './alight-balloon-plugin-command';

export class AlightBalloonPluginEditing extends Plugin {
  public static get requires() {
    return [LinkEditing];
  }

  public static get pluginName() {
    return 'AlightBalloonPluginEditing';
  }

  public init(): void {
    // console.log('AlightBalloonPluginEditing#init()');

    // If you only want to rely on the built-in 'link' command, you can skip adding your own command.
    this.editor.commands.add('alightBalloonPlugin', new AlightBalloonPluginCommand(this.editor));
  }
}
