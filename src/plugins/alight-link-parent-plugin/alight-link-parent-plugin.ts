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
      'AlightPublicLinkPluginUI',
      'AlightPredefinedLinkPluginUI',
      'AlightPublicLinkPlugin',
      'AlightPredefinedLinkPlugin'
    ];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;
    // Debug: Log available plugins and commands
    console.log('Available plugins:', Array.from(editor.plugins));
    console.log('Available commands:', Array.from(editor.commands.names()));

    editor.ui.componentFactory.add('alightLinkParentPlugin', (locale) => {
      const dropdown = this._createDropdown(locale);
      const listView = this._createListView(locale, dropdown);

      // Add ListView to dropdown panel
      dropdown.panelView.children.add(listView);

      // Configure dropdown behavior
      this._configureDropdownBehavior(dropdown);

      return dropdown;
    });
  }

  private _createDropdown(locale: Locale | undefined) {
    const t = this.editor.t;
    const dropdown = createDropdown(locale);

    // Configure dropdown
    dropdown.set({
      class: 'ck-dropdown ck-alight-link-dropdown',
      // panelPosition: 'sw'
    });

    // Configure button
    const buttonView = dropdown.buttonView;
    buttonView.set({
      icon: ToolBarIcon,
      label: t('Parent Link'),
      tooltip: true,
      withText: true,
    });

    // Bind dropdown enabled state to command availability
    const publicLinkCommand = this.editor.commands.get('alightPublicLinkPlugin');
    const predefinedLinkCommand = this.editor.commands.get('alightPredefinedLinkPlugin');
    if (publicLinkCommand && predefinedLinkCommand) {
      dropdown.bind('isEnabled').to(
        publicLinkCommand,
        'isEnabled',
        predefinedLinkCommand,
        'isEnabled',
        (publicEnabled, predefinedEnabled) => publicEnabled || predefinedEnabled
      );
    }

    return dropdown;
  }

  private _createListView(locale: Locale | undefined, dropdown: DropdownView) {
    const t = this.editor.t;
    const listView = new ListView(locale);

    // Add header
    const headerView = this._createHeaderView(locale);
    listView.items.add(headerView);
    listView.items.add(new ListSeparatorView(locale));

    // Define child plugins
    const childPlugins = [
      {
        label: t('Public Link'),
        command: 'alightPublicLinkPlugin',
        pluginName: 'AlightPublicLinkPluginUI',
        // icon: ToolBarIcon
      },
      {
        label: t('Predefined Link'),
        command: 'alightPredefinedLinkPlugin',
        pluginName: 'AlightPredefinedLinkPluginUI',
        // icon: ToolBarIcon
      }
    ];

    // Add plugin options
    childPlugins.forEach(item => {
      const listItem = this._createListItem(locale, item, dropdown);
      listView.items.add(listItem);
    });

    return listView;
  }

  private _createHeaderView(locale: Locale | undefined) {
    const t = this.editor.t;
    const headerView = new View(locale);

    headerView.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-dropdown__header'].join(' '),
        style: 'padding: 2px 16px 4px; font-weight: 700; color: var(--ck-color-dropdown-header-text)'
      },
      children: [
        {
          text: t('Choose Link Type')
        }
      ]
    });

    return headerView;
  }

  private _createListItem(
    locale: Locale | undefined,
    item: {
      label: string;
      command: string;
      pluginName: string;
      icon: any;
    },
    dropdown: DropdownView
  ) {
    const listItem = new ListItemView(locale);
    listItem.set({
      // class: ['ck', 'ck-list__item'].join(' ')
    });

    const button = new ButtonView(locale);
    button.set({
      label: item.label,
      icon: item.icon,
      withText: true,
      // class: ['ck', 'ck-button', 'ck-button-action'].join(' '),
      isToggleable: false
    });

    // Bind event directly to execute command and show modal
    button.on('execute', () => {
      const command = this.editor.commands.get(item.command);
      console.log('Button clicked, command:', item.command);
      console.log('Plugin name:', item.pluginName);

      dropdown.isOpen = false;

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

    // Bind button state to command state
    const command = this.editor.commands.get(item.command);
    if (command) {
      button.bind('isEnabled').to(command);
    }

    listItem.children.add(button);
    return listItem;
  }

  private _configureDropdownBehavior(dropdown: DropdownView) {
    dropdown.on('change:isOpen', () => {
      if (!dropdown.isOpen) {
        this.editor.editing.view.focus();
      }
    });

    // Handle keyboard navigation
    dropdown.keystrokes.set('arrowdown', (data: any, cancel: () => void) => {
      if (dropdown.isOpen) {
        dropdown.panelView.focus();
        cancel();
      }
    });
  }

  override destroy() {
    super.destroy();
  }
}