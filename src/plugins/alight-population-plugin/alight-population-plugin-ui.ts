// src/plugins/alight-population-plugin/alight-population-plugin-ui.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ToolBarIcon from './../../../theme/icons/icon-population.svg';
import './styles/alight-population-plugin.scss';

export default class AlightPopulationPluginUI extends Plugin {
  init() {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightPopulationPlugin', (locale) => {
      const button = new ButtonView(locale);

      button.set({
        icon: ToolBarIcon,
        label: t('Insert Alight Population'),
        tooltip: true,
        withText: false,
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