// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkTriggerEditing from './alight-link-trigger-plugin-editing';
import AlightLinkTriggerUI from './alight-link-trigger-plugin-ui';

export default class AlightLinkTriggerPlugin extends Plugin {
  public static get pluginName() {
    return 'AlightLinkTrigger' as const;
  }

  public static get requires() {
    return [AlightLinkTriggerEditing, AlightLinkTriggerUI] as const;
  }
}
