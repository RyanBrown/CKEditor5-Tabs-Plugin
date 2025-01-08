import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// This UI plugin adds a button that triggers the link insertion flow.
// In this version, we demonstrate how to open a PrimeNG modal instead of using prompt().
export default class AlightLinkPluginUI extends Plugin {
    // The plugin's name.
    static get pluginName() {
        return 'AlightLinkPluginUI';
    }

    // Initializes the plugin, registers the UI components (button).
    init(): void {
        const editor = this.editor;
        const t = editor.t;

        // Add the UI button for link insertion
        editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
            // Create the basic button view
            const buttonView = createLinkFormView(locale, editor);

            // Configure the button with icon, label, and tooltip
            buttonView.set({
                icon: ToolBarIcon,
                label: t('Insert Link'),
                tooltip: true,
                withText: true,
            });

            // Handle button click
            this.listenTo(buttonView, 'execute', () => {
                const command = editor.commands.get('alightLinkPlugin');

                // --- EXAMPLE: Opening a PrimeNG modal to get the link info ---
                // You would replace the following code with your actual PrimeNG modal logic.
                // For instance, you might inject a service that shows a dialog and returns a promise:
                //
                //   this.primeNgModalService.open(SomeModalComponent).then((data) => {
                //       if (data && data.href) {
                //           editor.execute('alightLinkPlugin', { href: data.href });
                //       }
                //   });
                //
                // Below is a simple mock function that simulates retrieving a link from a modal.

                openExternalPrimeNGModalMock().then((href: string | null) => {
                    if (href) {
                        // Execute the command with the retrieved href
                        editor.execute('alightLinkPlugin', { href });
                    }
                });
            });

            return buttonView;
        });
    }
}

// Mock function simulating a PrimeNG modal that returns a Promise of the link string.
// In real code, replace with actual PrimeNG modal logic.
function openExternalPrimeNGModalMock(): Promise<string | null> {
    return new Promise((resolve) => {
        // Simulate a 1-second delay
        setTimeout(() => {
            // In practice, this value would come from the user's input in the modal
            const simulatedLink = prompt('Simulated: Enter link in the "modal":');
            resolve(simulatedLink);
        }, 1000);
    });
}
