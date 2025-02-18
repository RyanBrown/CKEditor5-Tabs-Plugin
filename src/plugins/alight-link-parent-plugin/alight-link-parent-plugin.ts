// src/plugins/alight-link-parent-plugin/alight-link-parent-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown, DropdownView } from '@ckeditor/ckeditor5-ui';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ToolBarIcon from './assets/icon-link.svg';
import { Locale } from '@ckeditor/ckeditor5-utils';

export default class AlightLinkParentPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkParentPluginUI';
  }

  static get requires() {
    return [
      'AlightPredefinedLinkPlugin',
      'AlightPredefinedLinkPluginUI',
      'AlightPublicLinkPlugin',
      'AlightPublicLinkPluginUI',
      'AlightNewDocumentLinkPlugin',
      'AlightNewDocumentLinkPluginUI',
    ];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightLinkParentPlugin', (locale) => {
      const dropdown = createDropdown(locale);
      dropdown.panelView.children.add(this._createListView(locale, dropdown));
      this._configureDropdown(dropdown);
      return dropdown;
    });
  }

  private _configureDropdown(dropdown: DropdownView) {
    const t = this.editor.t;
    const buttonView = dropdown.buttonView;
    buttonView.set({
      icon: ToolBarIcon,
      label: t('Parent Link'),
      tooltip: true,
      withText: true
    });

    dropdown.set({ class: 'ck-dropdown ck-alight-link-dropdown' });

    // Bind dropdown state to command availability
    const publicCommand = this.editor.commands.get('alightPublicLinkPlugin');
    const predefinedCommand = this.editor.commands.get('alightPredefinedLinkPlugin');
    const newDocumentCommand = this.editor.commands.get('alightNewDocumentLinkPlugin');
    if (publicCommand && predefinedCommand && newDocumentCommand) {
      dropdown.bind('isEnabled').to(
        publicCommand, 'isEnabled',
        predefinedCommand, 'isEnabled',
        newDocumentCommand, 'isEnabled',
        (publicEnabled, predefinedEnabled, newDocumentEnabled) => publicEnabled || predefinedEnabled || newDocumentEnabled
      );
    }

    dropdown.on('change:isOpen', () => {
      if (!dropdown.isOpen) this.editor.editing.view.focus();
    });

    // Improve keyboard navigation
    dropdown.keystrokes.set('arrowdown', (data: any, cancel: () => void) => {
      if (dropdown.isOpen) {
        dropdown.panelView.focus();
        cancel();
      }
    });
  }

  private _createListView(locale: Locale | undefined, dropdown: DropdownView): ListView {
    const listView = new ListView(locale);
    listView.items.add(this._createHeaderView(locale));
    listView.items.add(new ListSeparatorView(locale));

    // Define child plugins
    const childPlugins = [
      { label: 'Public Link', command: 'alightPublicLinkPlugin', pluginName: 'AlightPublicLinkPluginUI' },
      { label: 'Predefined Link', command: 'alightPredefinedLinkPlugin', pluginName: 'AlightPredefinedLinkPluginUI' },
      { label: 'New Document', command: 'alightNewDocumentLinkPlugin', pluginName: 'AlightNewDocumentLinkPluginUI' }
    ];

    // Create and add child plugin buttons
    childPlugins.forEach((plugin) => {
      listView.items.add(this._createListItem(locale, plugin, dropdown));
    });

    return listView;
  }

  private _createHeaderView(locale: Locale | undefined): View {
    const t = this.editor.t;
    const headerView = new View(locale);
    headerView.setTemplate({
      tag: 'div',
      attributes: {
        class: 'ck ck-dropdown__header',
        style: 'padding: 2px 16px 4px; font-weight: 700; color: var(--ck-color-dropdown-header-text)'
      },
      children: [{ text: t('Choose Link Type') }]
    });
    return headerView;
  }

  private _createListItem(locale: Locale | undefined, item: { label: string; command: string; pluginName: string }, dropdown: DropdownView): ListItemView {
    const listItem = new ListItemView(locale);
    const button = new ButtonView(locale);

    button.set({ label: item.label, withText: true });

    // Execute child plugin command on click
    button.on('execute', () => {
      dropdown.isOpen = false;
      const command = this.editor.commands.get(item.command);
      if (command) {
        try {
          const plugin = this.editor.plugins.get(item.pluginName);
          if (plugin && '_showModal' in plugin) {
            (plugin as any)._showModal();
          } else {
            console.warn(`Plugin ${item.pluginName} not found or _showModal not available`);
          }
        } catch (error) {
          console.error(`Error showing modal for ${item.pluginName}:`, error);
        }
      }
    });

    // Bind button state to command availability
    const command = this.editor.commands.get(item.command);
    if (command) button.bind('isEnabled').to(command);

    listItem.children.add(button);
    return listItem;
  }
}
