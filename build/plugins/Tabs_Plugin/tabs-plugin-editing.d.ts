export default class TabsPluginEditing extends Plugin {
    static get pluginName(): string;
    init(): void;
    _disableCommandsAndButtons(commandsToDisable: any, disable: any): void;
    _ensureTabIds(): void;
    _defineSchema(): void;
    _defineConverters(): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
