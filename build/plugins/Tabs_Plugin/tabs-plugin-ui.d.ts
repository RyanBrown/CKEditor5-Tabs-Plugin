export default class TabsPluginUI extends Plugin {
    init(): void;
    _insertTabsPlugin(editor: any): void;
    findTabListItem(tabsRoot: any, tabId: any): any;
    findTabNestedContent(tabsRoot: any, tabId: any): any;
    _registerEventHandlers(editor: any): void;
    _addNewTab(editor: any): void;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
