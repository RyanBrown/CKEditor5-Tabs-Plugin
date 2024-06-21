export default class TabsPluginUI extends Plugin {
    init(): void;
    _insertTabsPlugin(editor: any): void;
    _registerEventHandlers(editor: any): void;
    _preventButtonClick(evt: any, button: any): void;
    _handleTabClick(editor: any, target: any, evt: any): void;
    _handleDeleteTab(editor: any, target: any, evt: any): void;
    _handleAddTab(editor: any, evt: any, data: any): void;
    _handleMoveTab(editor: any, target: any, evt: any, direction: any): void;
    _createConfirmationModal(): void;
    _addNewTab(editor: any, pluginId: any): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
