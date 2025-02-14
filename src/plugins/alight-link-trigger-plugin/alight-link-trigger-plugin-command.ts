// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { LinkTriggerItem } from './alight-link-trigger-plugin-utils';

export default class AlightLinkTriggerCommand extends Command {
  override execute(itemId: string): void {
    const config = this.editor.config.get('alightLinkTrigger.items') as LinkTriggerItem[];

    if (!Array.isArray(config)) {
      return;
    }

    const item = config.find((item) => item.id === itemId);

    if (item && item.trigger) {
      item.trigger(this.editor);
    }
  }

  override refresh(): void {
    this.isEnabled = true;
  }
}
