// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { DropdownButtonView, Model, createDropdown, addListToDropdown } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
import icon from '../assets/icon-link.svg';
import './styles/alight-link-trigger-plugin.scss';

export default class AlightLinkTriggerUI extends Plugin {
  init() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightLinkTrigger', locale => {
      const dropdown = createDropdown(locale);
      const items = editor.config.get('alightLinkTrigger.items') || [];

      // Configure dropdown
      dropdown.buttonView.set({
        label: t('Choose Link Type'),
        icon,
        tooltip: true
      });

      // Add items to dropdown
      const itemDefinitions = new Collection();
      items.forEach((item: any) => {
        const definition = {
          type: 'button',
          model: new Model({
            label: item.label,
            id: item.id,
            withText: true
          })
        };
        itemDefinitions.add(definition);
      });

      addListToDropdown(dropdown, itemDefinitions);

      // Handle item selection
      dropdown.on('execute', (eventInfo: any) => {
        const { id } = eventInfo.source;
        editor.execute('alightLinkTrigger', id);
      });

      return dropdown;
    });
  }
}