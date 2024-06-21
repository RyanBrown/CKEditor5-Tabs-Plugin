export default class TabsPluginEditing extends Plugin {
    static get pluginName(): string;
    init(): void;
    _defineSchema(): void;
    _defineConverters(): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
