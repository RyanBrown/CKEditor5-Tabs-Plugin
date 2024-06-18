export default class TabsPluginUI extends Plugin {
    init(): void;
    _insertTabsPlugin(editor: any): void;
    _registerEventHandlers(editor: any): void;
    _preventButtonClick(evt: any, button: any): void;
    _handleTabClick(editor: any, target: any, evt: any): void;
    _activateTab(editor: any, tabListItem: any): void;
    _handleDeleteTab(editor: any, target: any, evt: any): void;
    _handleAddTab(editor: any, evt: any): void;
    _handleMoveTab(editor: any, target: any, evt: any, direction: any): void;
    _addNewTab(editor: any): void;
    _createConfirmationModal(): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
