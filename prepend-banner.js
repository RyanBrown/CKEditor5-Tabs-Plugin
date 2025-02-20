'use strict';

/**
 * prepend-banner.js
 *
 * This script prepends a banner comment to the generated ckeditor.js file.
 * It is written as an ES module, so all imports use the ES module syntax.
 */

import { readFile, writeFile } from 'fs/promises'; // Import promise-based FS functions.
import path from 'path';
import { fileURLToPath } from 'url';

// Compute __filename and __dirname for ES modules.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the generated ckeditor.js file.
const filePath = path.resolve(__dirname, 'build', 'ckeditor.js');

// The banner comment to add at the top of the file.
const banner = '/* istanbul ignore next */\n';

/**
 * Prepend the banner to the ckeditor.js file.
 */
async function prependBanner() {
    try {
        // Read the existing content of the file.
        const data = await readFile(filePath, 'utf8');

        // Prepend the banner to the file content.
        const updatedContent = banner + data;

        // Write the updated content back to the file.
        await writeFile(filePath, updatedContent, 'utf8');

        console.log('/* istanbul ignore next */ successfully added to ckeditor.js');
    } catch (err) {
        console.error(`Error processing file: ${err}`);
        process.exit(1);
    }
}

// Execute the prepend operation.
prependBanner();
