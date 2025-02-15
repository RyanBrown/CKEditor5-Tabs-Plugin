// alight-link-trigger-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import linkIcon from '@ckeditor/ckeditor5-core/theme/icons/link.svg'; // <-- default icon import

import { ButtonView } from '@ckeditor/ckeditor5-ui';

export default class AlightLinkTriggerUI extends Plugin {
  public static get pluginName() {
    return 'AlightLinkTriggerUI';
  }

  public init(): void {
    console.log('AlightLinkTriggerUI#init called');

    const editor = this.editor;
    const t = editor.t;

    // Register a new button for "alightLinkTrigger".
    editor.ui.componentFactory.add('alightLinkTrigger', locale => {
      const command = editor.commands.get('alightLinkTrigger');
      const buttonView = new ButtonView(locale);

      buttonView.set({
        label: t('Link'),
        icon: linkIcon,
        tooltip: true
      });

      // Bind button state to command.
      buttonView.bind('isOn', 'isEnabled').to(command, 'value', 'isEnabled');

      // Execute the command when the button is clicked.
      this.listenTo(buttonView, 'execute', () => {
        editor.execute('alightLinkTrigger');
        editor.editing.view.focus();
      });

      return buttonView;
    });
  }
}
