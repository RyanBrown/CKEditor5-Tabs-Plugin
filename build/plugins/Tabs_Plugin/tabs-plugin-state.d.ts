export default TabsPluginState;
declare class TabsPluginState {
    constructor(editor: any);
    editor: any;
    tabs: Map<any, any>;
    activeTabId: any;
    addTab(tabId: any, tabData: any): void;
    removeTab(tabId: any): void;
    setActiveTab(tabId: any): void;
    getActiveTab(): any;
    moveTab(tabId: any, direction: any): void;
    getTabs(): [any, any][];
}
