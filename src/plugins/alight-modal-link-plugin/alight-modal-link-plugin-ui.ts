// src/plugins/alight-modal-link-plugin/alight-modal-link-plugin-ui.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ToolBarIcon from './assets/icon-link.svg';
import './styles/alight-modal-link-plugin.scss';

export default class AlightModalLinkPluginUI extends Plugin {
  init() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightModalLinkPlugin', (locale) => {
      const button = new ButtonView(locale);

      button.set({
        icon: ToolBarIcon,
        label: t('Modal Link'),
        tooltip: true,
        withText: true,
      });

      // Execute the population directly when clicked
      button.on('execute', () => {
        // Create a dummy File object for initial execution
        const file = new File([""], "dummy.txt", { type: "text/plain" });
        editor.execute('systemPopulations', { file });
        editor.editing.view.focus();
      });

      return button;
    });
  }
}