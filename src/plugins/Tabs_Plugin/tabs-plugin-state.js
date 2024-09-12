// tabs-plugin-state.js

import { ObservableMixin, mix } from '@ckeditor/ckeditor5-utils';

class TabsPluginState {
    constructor(editor) {
        this.editor = editor;
        this.tabs = new Map();
        this.activeTabId = null;
    }

    addTab(tabId, tabData) {
        this.tabs.set(tabId, { ...tabData, isActive: false });
        this.fire('tabAdded', { tabId, tabData });
    }

    removeTab(tabId) {
        if (this.tabs.has(tabId)) {
            this.tabs.delete(tabId);
            if (this.activeTabId === tabId) {
                this.setActiveTab(this.tabs.keys().next().value);
            }
            this.fire('tabRemoved', { tabId });
        }
    }

    setActiveTab(tabId) {
        if (this.tabs.has(tabId)) {
            if (this.activeTabId) {
                this.tabs.get(this.activeTabId).isActive = false;
            }
            this.activeTabId = tabId;
            this.tabs.get(tabId).isActive = true;
            this.fire('activeTabChanged', { tabId });
        }
    }

    getActiveTab() {
        return this.activeTabId ? this.tabs.get(this.activeTabId) : null;
    }

    moveTab(tabId, direction) {
        // Implementation for moving tabs
        // This would involve reordering the tabs in the Map
        // and firing a 'tabMoved' event
    }

    getTabs() {
        return Array.from(this.tabs.entries());
    }
}

mix(TabsPluginState, ObservableMixin);

export default TabsPluginState;
