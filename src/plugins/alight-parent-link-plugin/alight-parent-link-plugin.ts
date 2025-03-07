// src/plugins/alight-parent-link-plugin/alight-parent-link-plugin.ts
/**
 * A CKEditor plugin that provides a dropdown menu for different types of link insertions.
 * This parent plugin coordinates multiple child link plugins (email, document, generic, etc.).
 */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown, DropdownView } from '@ckeditor/ckeditor5-ui';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { ModalPluginInterface } from './../interfaces/custom-plugin-interfaces';

export default class AlightParentLinkPlugin extends Plugin {
  // Define link plugins configuration in a single place
  // To disable a plugin, comment out its entry
  private static readonly LINK_PLUGINS = [
    {
      name: 'AlightExternalLinkPlugin',
      uiName: 'AlightExternalLinkPluginUI',
      command: 'alightExternalLinkPlugin',
      label: 'External Site',
      order: 1
    },
    // {
    //   name: 'AlightPredefinedLinkPlugin',
    //   uiName: 'AlightPredefinedLinkPluginUI',
    //   command: 'alightPredefinedLinkPlugin',
    //   label: 'Predefined Link',
    //   order: 2
    // },
    {
      name: 'AlightEmailLinkPlugin',
      uiName: 'AlightEmailLinkPluginUI',
      command: 'alightEmailLinkPlugin',
      label: 'Email',
      order: 3
    },
    // {
    //   name: 'AlightExistingDocumentLinkPlugin',
    //   uiName: 'AlightExistingDocumentLinkPluginUI',
    //   command: 'alightExistingDocumentLinkPlugin',
    //   label: 'Existing Document',
    //   order: 4
    // },
    // {
    //   name: 'AlightNewDocumentLinkPlugin',
    //   uiName: 'AlightNewDocumentLinkPluginUI',
    //   command: 'alightNewDocumentLinkPlugin',
    //   label: 'New Document',
    //   order: 5
    // }
  ];

  // Define the plugin name for CKEditor registration
  static get pluginName() {
    return 'AlightParentLinkPlugin';
  }

  // Specify the required child plugins that this parent plugin depends on
  static get requires() {
    // Get both the main plugins and UI plugins
    const pluginNames = AlightParentLinkPlugin.LINK_PLUGINS.map(plugin => plugin.name);
    const uiPluginNames = AlightParentLinkPlugin.LINK_PLUGINS.map(plugin => plugin.uiName);

    // Combine and filter out any undefined values
    return [...pluginNames, ...uiPluginNames].filter(Boolean);
  }

  init() {
    const editor = this.editor;

    // Register the dropdown component factory
    editor.ui.componentFactory.add('alightParentLinkPlugin', (locale) => {
      const dropdown = createDropdown(locale);
      dropdown.panelView.children.add(this._createListView(locale, dropdown));
      this._configureDropdown(dropdown);
      return dropdown;
    });
  }

  private _configureDropdown(dropdown: DropdownView) {
    const t = this.editor.t;
    const buttonView = dropdown.buttonView;

    // Configure the dropdown button appearance
    buttonView.set({
      icon: ToolBarIcon,
      label: t('Parent Link'),
      tooltip: true,
      withText: true
    });

    // Add custom CSS class for styling
    dropdown.set({ class: 'ck-dropdown ck-alight-link-dropdown' });

    // By default, enable the dropdown
    dropdown.isEnabled = true;

    // Return focus to editor when dropdown closes
    dropdown.on('change:isOpen', () => {
      if (!dropdown.isOpen) this.editor.editing.view.focus();
    });

    // Add keyboard navigation support
    dropdown.keystrokes.set('arrowdown', (data: any, cancel: () => void) => {
      if (dropdown.isOpen) {
        dropdown.panelView.focus();
        cancel();
      }
    });
  }

  /**
   * Create the list view containing all link type options
   * @param locale - The locale for internationalization
   * @param dropdown - The parent dropdown view
   * @returns ListView containing all link type options
   */
  private _createListView(locale: Locale | undefined, dropdown: DropdownView): ListView {
    const listView = new ListView(locale);
    const t = this.editor.t;

    // Add header and separator
    listView.items.add(this._createHeaderView(locale));
    listView.items.add(new ListSeparatorView(locale));

    // Sort plugins by order property
    const sortedPlugins = [...AlightParentLinkPlugin.LINK_PLUGINS].sort((a, b) => a.order - b.order);

    // Create list items for each link type
    sortedPlugins.forEach((plugin) => {
      // Translate the label
      const translatedPlugin = {
        ...plugin,
        label: t(plugin.label)
      };

      listView.items.add(this._createListItem(locale, translatedPlugin, dropdown));
    });

    return listView;
  }

  /**
   * Create the header view for the dropdown
   * @param locale - The locale for internationalization
   * @returns View containing the header
   */
  private _createHeaderView(locale: Locale | undefined): View {
    const t = this.editor.t;
    const headerView = new View(locale);

    // Configure header template with styling
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

  /**
   * Create a list item for a specific link type
   * @param locale - The locale for internationalization
   * @param item - Configuration object for the link type
   * @param dropdown - The parent dropdown view
   * @returns ListItemView containing the link type button
   */
  private _createListItem(
    locale: Locale | undefined,
    item: { label: string; command: string; name: string; uiName: string },
    dropdown: DropdownView
  ): ListItemView {
    const listItem = new ListItemView(locale);
    const button = new ButtonView(locale);

    // Configure button appearance
    button.set({ label: item.label, withText: true });

    // Handle button click by showing the appropriate modal
    button.on('execute', () => {
      dropdown.isOpen = false;

      try {
        // First, try to get the UI plugin which has the showUI method
        if (item.uiName && this.editor.plugins.has(item.uiName)) {
          const uiPlugin = this.editor.plugins.get(item.uiName);

          // Check if the UI plugin has a showUI method
          if (uiPlugin && typeof (uiPlugin as any).showUI === 'function') {
            (uiPlugin as any).showUI();
            return;
          }
        }

        // If UI plugin doesn't exist or doesn't have showUI, try the main plugin
        const plugin = this.editor.plugins.get(item.name) as ModalPluginInterface;

        // Check if the plugin has a _showModal method
        if (plugin && typeof plugin._showModal === 'function') {
          plugin._showModal();
          return;
        }

        // Fallback to using command if neither UI method is available
        const command = this.editor.commands.get(item.command);
        if (command) {
          this.editor.execute(item.command);
        } else {
          console.warn(`Command ${item.command} not found for plugin ${item.name}`);
        }
      } catch (error) {
        console.error(`Error showing modal for ${item.name}:`, error);
      }
    });

    // All buttons in the dropdown are enabled by default
    button.isEnabled = true;

    // Try to bind to command if it exists
    try {
      const command = this.editor.commands.get(item.command);
      if (command && typeof command.isEnabled !== 'undefined') {
        button.bind('isEnabled').to(command);
      }
    } catch (e) {
      // If binding fails, keep the button enabled
      console.warn(`Could not bind button state for ${item.name}`, e);
    }

    listItem.children.add(button);
    return listItem;
  }
}