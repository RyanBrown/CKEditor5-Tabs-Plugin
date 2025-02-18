// src/plugins/alight-link-parent-plugin/alight-link-parent-plugin.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { createDropdown } from '@ckeditor/ckeditor5-ui';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import ToolBarIcon from './assets/icon-link.svg';

export default class AlightLinkParentPluginUI extends Plugin {
  static get requires() {
    return ['AlightPublicLinkPlugin', 'AlightPredefinedLinkPlugin'];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightLinkParentPlugin', (locale) => {
      const dropdown = createDropdown(locale);

      // Configure the dropdown button
      const buttonView = dropdown.buttonView;
      buttonView.set({
        icon: ToolBarIcon,
        label: t('Parent Plugin'),
        tooltip: true,
        withText: true,
      });

      // Create ListView for dropdown panel
      const listView = new ListView(locale);

      // Header for dropdown
      const headerView = new View(locale);
      headerView.setTemplate({
        tag: 'div',
        attributes: { class: 'dropdown-header', style: 'padding: 2px 16px 4px; font-weight: 700' },
        children: [{ text: t('Choose Link Type') }],
      });

      listView.items.add(headerView);
      listView.items.add(new ListSeparatorView(locale));

      // Define child plugin options
      const childPlugins = [
        { label: t('Public Link'), command: 'alightPublicLinkPlugin' },
        { label: t('Predefined Link'), command: 'alightPredefinedLinkPlugin' },
      ];

      // Populate dropdown with options
      childPlugins.forEach((item) => {
        const listItem = new ListItemView(locale);
        const button = new ButtonView(locale);
        button.set({ label: item.label, withText: true });

        button.on('execute', () => {
          editor.execute(item.command);
          editor.editing.view.focus();
        });

        listItem.children.add(button);
        listView.items.add(listItem);
      });

      // Add ListView to dropdown panel
      dropdown.panelView.children.add(listView);

      return dropdown;
    });
  }
}
