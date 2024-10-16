import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import tabToolbarIcon from './assets/icon-tab.svg';
import './styles/tabs-plugin.css';

export default class TabsPlugin extends Plugin {
    static get requires() {
        return [Widget];
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add('tabsPlugin', new InsertTabsCommand(this.editor));
        this.editor.commands.add('addTab', new AddTabCommand(this.editor));
        this.editor.commands.add('moveTab', new MoveTabCommand(this.editor));
        this.editor.commands.add('deleteTab', new DeleteTabCommand(this.editor));

        this._addToolbarButton();
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register('tabsPlugin', {
            isObject: true,
            allowWhere: '$block',
        });

        schema.register('tab', {
            isObject: true,
            allowIn: 'tabs',
            allowAttributes: ['title'],
        });

        schema.register('tabContent', {
            isLimit: true,
            allowIn: 'tab',
            allowContentOf: '$block',
        });
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        // Tabs container
        conversion.for('upcast').elementToElement({
            model: 'tabsPlugin',
            view: {
                name: 'div',
                classes: ['tabcontainer', 'yui3-widget'],
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabsPlugin',
            view: {
                name: 'div',
                classes: ['tabcontainer', 'yui3-widget'],
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabsPlugin',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', { class: 'tabcontainer yui3-widget' });
                return toWidget(div, viewWriter, { label: 'tabs widget' });
            },
        });

        // Individual tab
        conversion.for('upcast').elementToElement({
            model: (viewElement, { writer }) => {
                return writer.createElement('tab', {
                    title: viewElement.getAttribute('data-title') || 'Tab',
                });
            },
            view: {
                name: 'div',
                classes: 'tab',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tab',
            view: (modelElement, { writer: viewWriter }) => {
                return viewWriter.createContainerElement('div', {
                    class: 'tab',
                    'data-title': modelElement.getAttribute('title'),
                });
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tab',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createContainerElement('div', {
                    class: 'tab',
                    'data-title': modelElement.getAttribute('title'),
                });
                return toWidget(div, viewWriter, { label: 'tab' });
            },
        });

        // Tab content
        conversion.for('upcast').elementToElement({
            model: 'tabContent',
            view: {
                name: 'div',
                classes: 'tabcontent',
            },
        });

        conversion.for('dataDowncast').elementToElement({
            model: 'tabContent',
            view: {
                name: 'div',
                classes: 'tabcontent',
            },
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'tabContent',
            view: (modelElement, { writer: viewWriter }) => {
                const div = viewWriter.createEditableElement('div', { class: 'tabcontent' });
                return toWidgetEditable(div, viewWriter);
            },
        });
    }

    _addToolbarButton() {
        const editor = this.editor;
        const t = editor.t;

        editor.ui.componentFactory.add('tabsPlugin', (locale) => {
            const button = new ButtonView(locale);

            button.set({
                icon: tabToolbarIcon,
                label: t('Insert Tabs'),
                withText: true,
                tooltip: true,
            });

            button.on('execute', () => {
                editor.execute('tabsPlugin');
            });

            return button;
        });
    }
}

class InsertTabsCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabs = writer.createElement('tabs');

            // Create initial tabs
            for (let i = 1; i <= 4; i++) {
                const tab = writer.createElement('tab', { title: `Tab ${i}` });
                const tabContent = writer.createElement('tabContent');
                writer.append(tabContent, tab);
                writer.append(tab, tabs);
            }

            editor.model.insertContent(tabs, selection);
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const allowedIn = model.schema.findAllowedParent(selection.getFirstPosition(), 'tabs');

        this.isEnabled = allowedIn !== null;
    }
}

class AddTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabsElement = selection.getFirstPosition().findAncestor('tabs');

            if (tabsElement) {
                const newTab = writer.createElement('tab', { title: `New Tab` });
                const tabContent = writer.createElement('tabContent');
                writer.append(tabContent, newTab);
                writer.append(newTab, tabsElement);
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabsElement = selection.getFirstPosition().findAncestor('tabs');

        this.isEnabled = !!tabsElement;
    }
}

class MoveTabCommand extends Command {
    execute(options) {
        const { direction } = options;
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabElement = selection.getFirstPosition().findAncestor('tab');
            const tabsElement = tabElement.parent;

            if (tabElement && tabsElement) {
                const index = tabsElement.getChildIndex(tabElement);
                const newIndex = direction === 'left' ? index - 1 : index + 1;

                if (newIndex >= 0 && newIndex < tabsElement.childCount) {
                    writer.move(writer.createRangeOn(tabElement), tabsElement, newIndex);
                }
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabElement = selection.getFirstPosition().findAncestor('tab');

        this.isEnabled = !!tabElement;
    }
}

class DeleteTabCommand extends Command {
    execute() {
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change((writer) => {
            const tabElement = selection.getFirstPosition().findAncestor('tab');

            if (tabElement) {
                writer.remove(tabElement);
            }
        });
    }

    refresh() {
        const selection = this.editor.model.document.selection;
        const tabElement = selection.getFirstPosition().findAncestor('tab');

        this.isEnabled = !!tabElement;
    }
}
