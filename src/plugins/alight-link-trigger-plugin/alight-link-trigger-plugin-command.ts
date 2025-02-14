// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';

export default class AlightLinkTriggerCommand extends Command {
  execute(itemId: string) {
    const config = this.editor.config.get('alightLinkTrigger.items');
    const item = config.find((item: any) => item.id === itemId);

    if (item && item.trigger) {
      item.trigger(this.editor);
    }
  }

  refresh() {
    this.isEnabled = true;
  }
}