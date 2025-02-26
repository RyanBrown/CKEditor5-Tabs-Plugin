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

export default class AlightParentLinkPluginUI extends Plugin {
  // Define the plugin name for CKEditor registration
  static get pluginName() {
    return 'AlightParentLinkPluginUI';
  }

  // Specify the required child plugins that this parent plugin depends on
  static get requires() {
    return [
      'AlightEmailLinkPlugin',
      'AlightEmailLinkPluginUI',
      'AlightExistingDocumentLinkPlugin',
      'AlightExistingDocumentLinkPluginUI',
      'AlightGenericLinkPlugin',
      'AlightGenericLinkPluginUI',
      'AlightNewDocumentLinkPlugin',
      'AlightNewDocumentLinkPluginUI',
      'AlightPredefinedLinkPlugin',
      'AlightPredefinedLinkPluginUI',
    ];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

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

    // Add header and separator
    listView.items.add(this._createHeaderView(locale));
    listView.items.add(new ListSeparatorView(locale));

    // Define available link types and their configurations
    // The order of the list is set here
    const childPlugins = [
      { label: 'External Site', command: 'alightGenericLinkPlugin', pluginName: 'AlightGenericLinkPluginUI' },
      { label: 'Predefined Link', command: 'alightPredefinedLinkPlugin', pluginName: 'AlightPredefinedLinkPluginUI' },
      { label: 'Email', command: 'applyEmailLinkPlugin', pluginName: 'AlightEmailLinkPluginUI' },
      { label: 'Existing Document', command: 'alightExistingDocumentLinkPlugin', pluginName: 'AlightExistingDocumentLinkPluginUI' },
      { label: 'New Document', command: 'alightNewDocumentLinkPlugin', pluginName: 'AlightNewDocumentLinkPluginUI' },
    ];

    // Create list items for each link type
    childPlugins.forEach((plugin) => {
      listView.items.add(this._createListItem(locale, plugin, dropdown));
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
  private _createListItem(locale: Locale | undefined, item: { label: string; command: string; pluginName: string }, dropdown: DropdownView): ListItemView {
    const listItem = new ListItemView(locale);
    const button = new ButtonView(locale);

    // Configure button appearance
    button.set({ label: item.label, withText: true });

    // Handle button click by showing the appropriate modal
    button.on('execute', () => {
      dropdown.isOpen = false;

      try {
        // Try to get the plugin
        const plugin = this.editor.plugins.get(item.pluginName) as ModalPluginInterface;

        // Check if the plugin has a _showModal method
        if (plugin && typeof plugin._showModal === 'function') {
          plugin._showModal();
          return;
        }

        // Fallback to using command if _showModal is not available
        const command = this.editor.commands.get(item.command);
        if (command) {
          this.editor.execute(item.command);
        } else {
          console.warn(`Command ${item.command} not found for plugin ${item.pluginName}`);
        }
      } catch (error) {
        console.error(`Error showing modal for ${item.pluginName}:`, error);
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
      console.warn(`Could not bind button state for ${item.pluginName}`, e);
    }

    listItem.children.add(button);
    return listItem;
  }
}