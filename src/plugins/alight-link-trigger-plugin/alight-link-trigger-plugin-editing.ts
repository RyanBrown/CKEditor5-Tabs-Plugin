// alight-link-trigger-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkTriggerCommand from './alight-link-trigger-plugin-command';

export default class AlightLinkTriggerEditing extends Plugin {
  public static get pluginName() {
    return 'AlightLinkTriggerEditing';
  }

  public init(): void {
    // Register the command:
    this.editor.commands.add('alightLinkTrigger', new AlightLinkTriggerCommand(this.editor));

    // Optionally, add schema / conversion if needed:
    // const model = this.editor.model;
    // const doc = model.document;
    // ...
  }
}
