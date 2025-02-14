// src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  DropdownButtonView,
  createDropdown,
  addListToDropdown,
  type ListDropdownItemDefinition
} from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
import type { LinkTriggerItem } from './alight-link-trigger-plugin-utils';
import icon from '../assets/icon-link.svg';

export default class AlightLinkTriggerUI extends Plugin {
  init(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightLinkTrigger', locale => {
      const dropdown = createDropdown(locale);
      const items = editor.config.get('alightLinkTrigger.items') as LinkTriggerItem[] || [];

      // Configure dropdown
      dropdown.buttonView.set({
        label: t('Choose Link Type'),
        icon,
        tooltip: true
      });

      // Add items to dropdown
      const itemDefinitions = new Collection<ListDropdownItemDefinition>();

      items.forEach((item: LinkTriggerItem) => {
        const definition: ListDropdownItemDefinition = {
          type: 'button',
          model: {
            label: item.label,
            id: item.id,
            withText: true
          }
        };
        itemDefinitions.add(definition);
      });

      addListToDropdown(dropdown, itemDefinitions);

      // Handle item selection
      dropdown.on('execute', eventInfo => {
        const { id } = eventInfo.source;
        editor.execute('alightLinkTrigger', id);
      });

      return dropdown;
    });
  }
}
