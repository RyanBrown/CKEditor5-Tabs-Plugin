import Plugin from '@ckeditor/ckeditor5-core/src/plugin'; // Import the base Plugin class from CKEditor
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview'; // Import ButtonView for creating custom toolbar buttons
import ToolBarIcon from './assets/icon-modal.svg';

// A CKEditor plugin to trigger a modal when the button is clicked.
export default class ModalTriggerPlugin extends Plugin {
    // Initializes the plugin. This method is called automatically by CKEditor.
    init() {
        const editor = this.editor;

        console.log('ModalTriggerPlugin initialized.'); // Log when the plugin is initialized

        // Add a custom button to the CKEditor toolbar
        editor.ui.componentFactory.add('modalTrigger', (locale) => {
            console.log('Creating "modalTrigger" button...'); // Log when the button is being created

            // Create a new button view
            const view = new ButtonView(locale);

            // Set the button's properties
            view.set({
                icon: ToolBarIcon,
                label: 'Open Modal', // Button label text
                withText: true, // Display the label next to the button
                tooltip: true, // Enable tooltip on hover
            });

            // Add an event listener for button clicks
            view.on('execute', () => {
                console.log('ModalTrigger button clicked.'); // Log when the button is clicked

                // Check how many listeners are attached to the 'modalTrigger:openModal' event
                const listenersCount = editor.listenerCount('modalTrigger:openModal');
                console.log(`Listeners for 'modalTrigger:openModal': ${listenersCount}`); // Log the number of connected listeners

                // If no listeners are attached, display a warning and an alert
                if (listenersCount === 0) {
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

//     onEditorReady(editor: any) {
//         // Listen for the custom plugin event
//         editor.on('modalTrigger:openModal', () => {
//             console.log('Modal trigger event received!');
//             this.displayModal = true; // Show the modal
//         });
//     }
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
