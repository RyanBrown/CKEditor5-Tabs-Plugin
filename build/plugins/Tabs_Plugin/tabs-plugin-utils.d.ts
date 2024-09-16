export function generateId(prefix: any): string;
export function createTabsPlugin(writer: any, pluginId: any): any;
export function findAllDescendants(node: any, predicate: any): any;
export function createTabElement(writer: any, pluginId: any, tabId: any): {
    tabListItem: any;
    tabNestedContent: any;
};
export function createTabListItem(writer: any, tabId: any, pluginId: any): any;
export function createTabNestedContent(writer: any, tabId: any, pluginId: any): any;
export function createAddTabButton(writer: any): any;
export function appendControlElement(writer: any, parent: any, type: any, title: any): any;
export function setActiveClass(writer: any, element: any): void;
export function removeActiveClass(writer: any, element: any): void;
export function ensureActiveTab(writer: any, model: any): void;
export function activateTab(editor: any, tabListItem: any, tabPluginId: any): void;
export function initializeTabsOnLoad(editor: any): void;
