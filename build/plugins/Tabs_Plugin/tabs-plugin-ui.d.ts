export default class TabsPluginUI extends Plugin {
    init(): void;
    isSelectionInTableOrCell(): boolean;
    isSelectionInAncestors(ancestors: any): boolean;
    isInAccordion(): boolean;
    isInTabComponent(): boolean;
    isSelectionInDisallowedContext(): boolean;
    _registerEventHandlers(editor: any): void;
    _handleTabClick(editor: any, target: any, evt: any): void;
    _handleMoveTab(editor: any, target: any, evt: any, direction: any): void;
    _handleDeleteTab(editor: any, target: any, evt: any): void;
    _createConfirmationModal(): void;
    _handleAddTab(editor: any): void;
    _findClosestTabsPlugin(editor: any): any;
}
import { Plugin } from '@ckeditor/ckeditor5-core';
