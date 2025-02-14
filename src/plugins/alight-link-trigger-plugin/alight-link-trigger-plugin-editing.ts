// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkTriggerCommand from './alight-link-trigger-plugin-command';

export default class AlightLinkTriggerEditing extends Plugin {
  init() {
    this.editor.commands.add('alightLinkTrigger', new AlightLinkTriggerCommand(this.editor));
  }
}
