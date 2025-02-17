// Import the components
import CkAlightModalDialog from './CkAlight-modal-dialog.js';
import './CkAlight-modal-dialog.css';

// Create a new dialog instance
const dialog = new CkAlightModalDialog({
modal: true,
draggable: true,
resizable: true,
maximizable: true,
width: '800px'
});

// Example usage with CKEditor
ClassicEditor
.create(document.querySelector('#editor'), {
// Your CKEditor configuration...
})
.then(editor => {
// Example custom plugin that uses the modal
editor.plugins.get('MyCustomPlugin').on('openDialog', () => {
dialog.setTitle('My Custom Plugin');

            // Create content for the dialog
            const content = document.createElement('div');
            content.innerHTML = `
                <div class="my-plugin-content">
                    <!-- Your plugin's UI elements -->
                </div>
            `;

            // Create footer with actions
            const footer = document.createElement('div');
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.onclick = () => {
                // Handle save action
                dialog.hide();
            };
            footer.appendChild(saveBtn);

            // Set dialog content and footer
            dialog.setContent(content);
            dialog.setFooter(footer);

            // Show the dialog
            dialog.show();
        });
    })
    .catch(error => {
        console.error(error);
    });
