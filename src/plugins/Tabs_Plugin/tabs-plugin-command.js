import { Command } from '@ckeditor/ckeditor5-core';
import { generateId, createTabsPlugin } from './tabs-plugin-utils';

export default class TabsPluginCommand extends Command {
    execute() {
        this.editor.model.change((writer) => {
            const uniqueId = generateId('plugin-id');
            const tabsPlugin = createTabsPlugin(writer, uniqueId);
            this.editor.model.insertContent(tabsPlugin);
            console.log('TabsPlugin inserted:', tabsPlugin);
            this._ensureActiveTab(writer);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabsPlugin');

        this.isEnabled = allowedIn !== null;
    }

    _ensureActiveTab(writer) {
        const model = this.editor.model;
        const root = model.document.getRoot();

        model.change(() => {
            let firstInactiveTab = null;
            let firstInactiveContent = null;

            for (const element of root.getChildren()) {
                if (element.is('element', 'tabsPlugin')) {
                    const containerDiv = element.getChild(0);
                    const tabHeader = containerDiv.getChild(0);
                    const tabList = tabHeader.getChild(0);

                    for (const tabListItem of tabList.getChildren()) {
                        if (!(tabListItem.getAttribute('class') || '').includes('active')) {
                            if (!firstInactiveTab) {
                                firstInactiveTab = tabListItem;
                            }
                        } else {
                            firstInactiveTab = null;
                            break;
                        }
                    }

                    const tabContent = containerDiv.getChild(1);
                    for (const tabNestedContent of tabContent.getChildren()) {
                        if (!(tabNestedContent.getAttribute('class') || '').includes('active')) {
                            if (!firstInactiveContent) {
                                firstInactiveContent = tabNestedContent;
                            }
                        } else {
                            firstInactiveContent = null;
                            break;
                        }
                    }

                    if (firstInactiveTab && firstInactiveContent) {
                        writer.setAttribute(
                            'class',
                            (firstInactiveTab.getAttribute('class') || '') + ' active',
                            firstInactiveTab
                        );
                        writer.setAttribute(
                            'class',
                            (firstInactiveContent.getAttribute('class') || '') + ' active',
                            firstInactiveContent
                        );
                        break;
                    }
                }
            }
        });
    }
}
