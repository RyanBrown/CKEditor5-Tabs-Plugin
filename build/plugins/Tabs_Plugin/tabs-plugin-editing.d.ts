export default class TabsPluginEditing extends Plugin {
    static get requires(): (typeof Widget)[];
    init(): void;
    _disableCommandsAndButtons(commandsToDisable: any, disable: any): void;
    _defineSchema(): void;
    _defineConverters(): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Widget } from '@ckeditor/ckeditor5-widget';
