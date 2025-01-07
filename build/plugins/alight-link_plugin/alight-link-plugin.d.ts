import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightLinkPluginEditing from './alight-link-plugin-editing';
export default class AlightLinkPlugin extends Plugin {
    static get requires(): (typeof AlightLinkPluginEditing)[];
    static get pluginName(): string;
}
