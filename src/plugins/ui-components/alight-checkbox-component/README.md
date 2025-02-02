# CK Alight Checkbox

The **CK Alight Checkbox** is a vanilla JavaScript custom element implemented using TypeScript and the Web Components API. It mimics the behavior of the PrimeNG checkbox by providing support for:

* Mouse click and keyboard toggling (Space/Enter)
* Initial value configuration via an attribute
* A `disabled` attribute to disable interactions
* Dispatching a custom `change` event whenever the checkbox state changes
* Encapsulated styling via the Shadow DOM (styles are written in SCSS)

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Development](#development)
* [Building](#building)
* [License](#license)

## Installation

1. **Clone the repository or copy the source files.**

   This repository includes the following key files:
   * `ck-alight-checkbox.ts` – TypeScript source code defining the custom element
   * `ck-alight-checkbox.scss` – SCSS file containing the styles for the component
   * `README.md` – This file

2. **Install dependencies:**

   This project uses a build system that supports TypeScript and SCSS (for example, Webpack with appropriate loaders).

   ```bash
   npm install
   ```

## Usage

1. **Build the Component**

   Use your build tool (e.g., Webpack) to compile the TypeScript and SCSS into a JavaScript bundle. For example, you might have a build command defined in your package.json:

   ```bash
   npm run build
   ```

   This should produce a JavaScript file (e.g., `bundle.js`) that registers the `<ck-alight-checkbox>` element.

2. **Include the Component in Your HTML**

   After building the project, include the generated JavaScript bundle in your HTML file:

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <title>CK Alight Checkbox Example</title>
     <!-- Include the compiled bundle -->
     <script src="path/to/bundle.js" defer></script>
   </head>
   <body>
     <!-- Use the custom element -->
     <ck-alight-checkbox initialvalue="false">
       Accept Terms and Conditions
     </ck-alight-checkbox>

     <script>
       // Listen for change events on the custom element.
       document.addEventListener('DOMContentLoaded', () => {
         const checkbox = document.querySelector('ck-alight-checkbox');
         checkbox.addEventListener('change', (event) => {
           console.log('Checkbox state changed:', event.detail);
         });
       });
     </script>
   </body>
   </html>
   ```

3. **Using the Attributes**

   * `initialvalue`: Set the initial state of the checkbox. Use "true" or "false" (case-insensitive)
   * `disabled`: When present, the checkbox is disabled and user interaction is prevented

   Example:

   ```html
   <ck-alight-checkbox initialvalue="true" disabled>
     I agree to the terms.
   </ck-alight-checkbox>
   ```

## Development

To work on the component:

1. Run in watch mode (if configured):

   ```bash
   npm run start
   ```

   This will recompile your TypeScript and SCSS files when changes are detected.

2. Edit the source files:
   * `ck-alight-checkbox.ts` for the component logic
   * `ck-alight-checkbox.scss` for the styling

## Building

Ensure your project is set up with a bundler (like Webpack) that handles:

* TypeScript compilation (using ts-loader or similar)
* SCSS compilation (using sass-loader, css-loader, and style-loader or extracting to a separate file)

Your `webpack.config.js` might look like this:

```javascript
const path = require('path');

module.exports = {
  mode: 'production', // or 'development'
  entry: './src/ck-alight-checkbox.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js', '.scss']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          'to-string-loader', // Converts CSS to a string for style injection
          'css-loader',       // Translates CSS into CommonJS
          'sass-loader'       // Compiles Sass to CSS
        ]
      }
    ]
  }
};
```

Then run:

```bash
npm run build
```

to produce your final bundle.

## License

This project is licensed under the MIT License.