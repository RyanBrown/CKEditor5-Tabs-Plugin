import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import ToolBarIcon from './assets/icon-image.svg';

export default class AlightImagePlugin extends Plugin {
    init() {
        const editor = this.editor;

        // Add a new toolbar button named 'alertButton'.
        editor.ui.componentFactory.add('alightImagePlugin', (locale) => {
            const buttonView = new ButtonView(locale);

            buttonView.set({
                icon: ToolBarIcon,
                label: 'Insert Alight Image',
                tooltip: true,
                withText: false,
            });

            // Add the click event listener.
            buttonView.on('execute', () => {
                alert('Hello! This is the  "Image" plugin.');
            });

            return buttonView;
        });
    }
}
