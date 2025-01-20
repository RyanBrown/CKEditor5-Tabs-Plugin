import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { Locale } from '@ckeditor/ckeditor5-utils';
import ToolBarIcon from './assets/icon-paste.svg';
import './styles/alight-paste-plugin.scss';

export default class AlightPastePlugin extends Plugin {
    init() {
        const editor = this.editor;
        const t = editor.t;

        // Add a new toolbar button named 'alertButton'.
        editor.ui.componentFactory.add('alightPastePlugin', (locale: Locale) => {
            const buttonView = new ButtonView(locale);

            buttonView.set({
                icon: ToolBarIcon,
                label: t('Alight Paste'),
                tooltip: true,
                withText: false,
            });

            // Add the click event listener.
            buttonView.on('execute', () => {
                alert(t('Hello! This is the "Paste" plugin.'));
            });

            return buttonView;
        });
    }
}
