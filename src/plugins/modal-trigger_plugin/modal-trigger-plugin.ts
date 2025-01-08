import Plugin from '@ckeditor/ckeditor5-core/src/plugin'; // Import the base Plugin class from CKEditor
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview'; // Import ButtonView for creating custom toolbar buttons
import ToolBarIcon from './assets/icon-modal.svg'; // Import a custom icon for the toolbar button

// A CKEditor plugin to trigger a modal when the button is clicked.
export default class ModalTriggerPlugin extends Plugin {
    private hasModalListener = false; // Flag to track if a listener is registered for the modal event

    // Initializes the plugin. This method is called automatically by CKEditor.
    init() {
        const editor = this.editor;

        console.log('ModalTriggerPlugin initialized.'); // Log when the plugin is initialized

        // Override the 'on' method of the editor to detect event listener registration
        const originalOn = editor.on.bind(editor);
        editor.on = (eventName, callback, options) => {
            if (eventName === 'modalTrigger:openModal') {
                this.hasModalListener = true; // Set the flag when a listener is registered for the modal event
                console.log('Listener registered for "modalTrigger:openModal".');
            }
            originalOn(eventName, callback, options);
        };

        // Add a custom button to the CKEditor toolbar
        editor.ui.componentFactory.add('modalTrigger', (locale) => {
            console.log('Creating "modalTrigger" button...'); // Log when the button is being created

            // Create a new button view
            const view = new ButtonView(locale);

            // Set the button's properties
            view.set({
                icon: ToolBarIcon, // Custom icon for the button
                label: 'Open Modal', // Button label text
                withText: true, // Display the label next to the button
                tooltip: true, // Enable tooltip on hover
            });

            // Add an event listener for button clicks
            view.on('execute', () => {
                console.log('ModalTrigger button clicked.'); // Log when the button is clicked

                // Check if any listeners are registered for the 'modalTrigger:openModal' event
                if (!this.hasModalListener) {
                    console.warn('No listeners connected to "modalTrigger:openModal" event.'); // Log a warning in the console
                    alert('No modal is connected to the modal event. Please ensure the event is handled.'); // Alert the user
                }

                // Fire the custom event 'modalTrigger:openModal' to notify Angular or other consumers
                editor.fire('modalTrigger:openModal');
            });

            console.log('"modalTrigger" button created successfully.'); // Log successful button creation

            return view; // Return the button view to be added to the toolbar
        });
    }
}

// app.component.ts
// import { Component } from '@angular/core';
// import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// // Import the modal-trigger plugin
// import ModalTriggerPlugin from './plugins/modal-trigger-plugin';

// ClassicEditor.builtinPlugins = [
//     ...ClassicEditor.builtinPlugins,
//     ModalTriggerPlugin
// ];

// @Component({
//     selector: 'app-root',
//     templateUrl: './app.component.html',
//     styleUrls: ['./app.component.css']
// })
// export class AppComponent {
//     public Editor = ClassicEditor;
//     public displayModal: boolean = false; // State to control the PrimeNG modal

// onEditorReady(editor: any) {
//   editor.on('modalTrigger:openModal', () => {
//       console.log('ModalTriggerPlugin event received: opening modal...');
//       this.displayModal = true; // Trigger the PrimeNG modal
//   });
// }
// }

// app.component.html
// <!-- CKEditor -->
// <div>
//   <ckeditor
//     [editor]="Editor"
//     (ready)="onEditorReady($event)">
//   </ckeditor>
// </div>

// <!-- PrimeNG Modal -->
// <p-dialog [(visible)]="displayModal" [modal]="true" [header]="'Modal Triggered'">
//   <p>This modal was triggered by the modal-trigger-plugin!</p>
//   <button pButton label="Close" icon="pi pi-times" (click)="displayModal = false"></button>
// </p-dialog>
