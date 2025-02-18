import { Plugin } from '@ckeditor/ckeditor5-core';
import { DropdownButtonView, DropdownView, SplitButtonView, createDropdown, ButtonView, View } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
import Model from '@ckeditor/ckeditor5-ui/src/model';
import ToolBarIcon from './assets/icon-link.svg';


export default class AlightLinkParentPlugin extends Plugin {
  static get requires() {
    return ['AlightPublicLinkPlugin', 'AlightPredefinedLinkPlugin'];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    // Create a dropdown button
    editor.ui.componentFactory.add('alightLinkParentPlugin', locale => {
      const dropdown = createDropdown(locale);
      const items = new Collection();

      // Define child plugins & their commands
      const childPlugins = [
        { name: 'AlightPublicLinkPlugin', label: t('Public Link'), command: 'alightPublicLinkPlugin' },
        { name: 'AlightPredefinedLinkPlugin', label: t('Predefined Link'), command: 'alightPredefinedLinkPlugin' }
      ];

      childPlugins.forEach(plugin => {
        const button = new ButtonView(locale);
        button.set({
          label: plugin.label,
          withText: true
        });

        button.on('execute', () => {
          editor.execute(plugin.command);
          editor.editing.view.focus();
        });

        items.add(button);
      });

      // Configure dropdown button
      dropdown.buttonView.set({
        icon: ToolBarIcon,
        label: 'Parent Dropdown',
        tooltip: true,
        withText: true
      });

      // Add buttons to dropdown panel
      items.forEach(button => {
        dropdown.panelView.children.add(button as any as View<HTMLElement>);
      });

      return dropdown;
    });
  }
}
