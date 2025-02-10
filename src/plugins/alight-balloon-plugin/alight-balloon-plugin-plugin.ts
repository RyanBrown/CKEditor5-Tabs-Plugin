// src/plugins/alight-custom-link-plugin/alight-custom-link-plugin.ts

/**
 * alight-custom-link-plugin.ts
 *
 * Main entry point that ties together Editing + UI.
 * IMPORTANT: If your build already has "LinkUI" included,
 * remove it (e.g. using removePlugins: [ 'LinkUI' ]) so this
 * plugin fully overrides the balloon UI.
 */

// If you'd like a default export:
// export default class AlightBalloonPlugin extends Plugin {
import { Plugin } from '@ckeditor/ckeditor5-core';
import { AlightBalloonPluginEditing } from './alight-balloon-plugin-editing';
import { AlightBalloonPluginUI } from './alight-balloon-plugin-ui';

export default class AlightBalloonPlugin extends Plugin {
  public static get requires() {
    return [AlightBalloonPluginEditing, AlightBalloonPluginUI];
  }

  public static get pluginName() {
    return 'AlightBalloonPlugin';
  }
}
