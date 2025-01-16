import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ToolBarIcon from './assets/icon-populations.svg';

export default class AlightPopulationPlugin extends Plugin {
    init() {
        const editor = this.editor;

        // Add a new toolbar button named 'alertButton'.
        editor.ui.componentFactory.add('alightPopulationPlugin', (locale) => {
            const buttonView = new ButtonView(locale);

            buttonView.set({
                icon: ToolBarIcon,
                label: 'Insert Population',
                tooltip: true,
                withText: false,
            });

            // Add the click event listener.
            buttonView.on('execute', () => {
                alert('Hello! This is the  "Population" plugin.');
            });

            return buttonView;
        });
    }
}
