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
            for (const element of root.getChildren()) {
                if (element.is('element', 'tabsPlugin')) {
                    const containerDiv = element.getChild(0);
                    const tabHeader = containerDiv.getChild(0);
                    const tabList = tabHeader.getChild(0);
                    const tabContent = containerDiv.getChild(1);

                    const firstTabListItem = tabList.getChild(0);
                    const firstTabNestedContent = tabContent.getChild(0);

                    if (firstTabListItem && !firstTabListItem.hasAttribute('class', 'active')) {
                        writer.setAttribute(
                            'class',
                            (firstTabListItem.getAttribute('class') || '') + ' active',
                            firstTabListItem
                        );
                    }

                    if (firstTabNestedContent && !firstTabNestedContent.hasAttribute('class', 'active')) {
                        writer.setAttribute(
                            'class',
                            (firstTabNestedContent.getAttribute('class') || '') + ' active',
                            firstTabNestedContent
                        );
                    }
                }
            }
        });
    }
}
