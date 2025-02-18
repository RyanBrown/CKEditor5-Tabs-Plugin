import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, createDropdown, addListToDropdown, DropdownButtonView, DropdownView } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

export default class AlightLinkParentPlugin extends Plugin {
  static get pluginName() {
    return 'AlightLinkParentPlugin';
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    const childPlugins = [
      { name: 'AlightPublicLinkPlugin', label: t('Public Link'), command: 'alightPublicLinkPlugin' },
      { name: 'AlightPredefinedLinkPlugin', label: t('Predefined Link'), command: 'alightPredefinedLinkPlugin' }
    ];

    editor.ui.componentFactory.add('alightLinkParentPlugin', (locale) => {
      const dropdown = createDropdown(locale);
      const dropdownButton = dropdown.buttonView;
      dropdownButton.set({
        label: t('Parent Plugin'),
        withText: true,
        tooltip: true
      });

      const itemCollection = new Collection();

      childPlugins.forEach(child => {
        const button = new ButtonView(locale);
        button.set({
          label: child.label,
          withText: true
        });

        button.on('execute', () => {
          editor.execute(child.command);
          editor.editing.view.focus();
        });

        itemCollection.add({ type: 'button', model: button });
      });

      const listDropdownItems = new Collection();
      itemCollection.forEach(item => {
        listDropdownItems.add({
          type: 'button',
          model: item.model
        });
      });

      addListToDropdown(dropdown, listDropdownItems);

      return dropdown;
    });
  }
}
