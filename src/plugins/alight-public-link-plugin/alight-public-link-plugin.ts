// src/plugins/alight-public-link-plugin/alight-public-link-plugin.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkEditing from './alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from './alight-public-link-plugin-ui';

export default class AlightPublicLinkPlugin extends Plugin {
  public static get requires() {
    return [AlightPublicLinkEditing, AlightPublicLinkPluginUI, Link];
  }

  public static get pluginName() {
    return 'AlightPublicLink' as const;
  }

  public init(): void {
    const editor = this.editor;

    // Initialize custom schema if needed
    editor.model.schema.extend('$text', {
      allowAttributes: ['alightPublicLinkPlugin']
    });
  }
}