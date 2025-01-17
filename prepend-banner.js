const fs = require('fs');
const path = require('path');

// Path to the generated ckeditor.js file
const filePath = path.resolve(__dirname, 'build', 'ckeditor.js');

// The banner comment to add at the top of the file
const banner = '/* istanbul ignore next */\n';

// Read the existing content of the file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading the file: ${err}`);
        process.exit(1);
    }

    // Prepend the banner to the file content
    const updatedContent = banner + data;

    // Write the updated content back to the file
    fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
        if (err) {
            console.error(`Error writing the file: ${err}`);
            process.exit(1);
        }
        console.log('/* istanbul ignore next */ successfully added to ckeditor.js');
    });
});
