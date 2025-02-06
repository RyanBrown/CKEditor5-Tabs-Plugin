// src/plugins/alight-custom-link/alight-custom-link.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightCustomLinkEditing from './alight-custom-link-editing';
import AlightCustomLinkUI from './alight-custom-link-ui';

export default class AlightCustomLink extends Plugin {
  public static get pluginName(): string {
    return 'AlightCustomLink';
  }

  // Load both editing (schema + command) and UI (balloon panel) parts of the plugin.
  public static get requires() {
    return [AlightCustomLinkEditing, AlightCustomLinkUI];
  }
}
