# CK Alight Radio Button

A custom, PrimeNG-like radio button component built with Web Components, TypeScript, and SCSS. This lightweight and reusable component encapsulates its structure, styles, and behavior, ensuring seamless integration into any web project without relying on external frameworks.

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
- [Usage](#usage)
- [Development](#development)
- [Project Structure](#project-structure)
- [Build Scripts](#build-scripts)
- [Customization](#customization)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Encapsulated Styles:** Uses Shadow DOM to prevent style leakage.
- **TypeScript Support:** Enhances code reliability with type safety.
- **SCSS Styling:** Leverages SCSS for modular and maintainable styles.
- **Customizable:** Easily customize colors, sizes, and behaviors via SCSS variables.
- **Accessibility:** Built-in support for ARIA attributes and keyboard navigation.
- **Responsive Animations:** Smooth transitions and animations for better user experience.
- **Disabled State:** Supports non-interactive radio buttons with distinct styling.

## Demo

*Screenshot of the CK Alight Radio Button in action.*

## Installation

To integrate the CK Alight Radio Button into your project, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cka-radio-button.git
cd cka-radio-button
```

### 2. Install Dependencies
Ensure you have Node.js installed. Then, install the necessary packages:
```bash
npm install
```

### 3. Build the Component
Compile the TypeScript and SCSS files using Webpack:
```bash
npm run build
```
This command generates the bundled JavaScript and CSS files in the `dist/` directory.

## Usage

### 1. Include the Component
Add the bundled JavaScript file to your HTML. Ensure you use the `type="module"` attribute for ES module support.
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CK Alight Radio Button Demo</title>
</head>
<body>
  <h1>CK Alight Radio Button Demo</h1>
  
  <!-- Radio Button Group -->
  <form id="radioForm">
    <cka-radio-button name="group1" value="option1" label="Option 1" checked></cka-radio-button>
    <cka-radio-button name="group1" value="option2" label="Option 2"></cka-radio-button>
    <cka-radio-button name="group1" value="option3" label="Option 3" disabled></cka-radio-button>
  </form>

  <!-- Include the bundled JavaScript -->
  <script type="module" src="../dist/cka-radio-button.js"></script>

  <script>
    document.getElementById('radioForm')?.addEventListener('change', (e) => {
      const selected = document.querySelector('cka-radio-button[name="group1"] input[type="radio"]:checked');
      if (selected) {
        console.log('Selected Value:', selected.value);
      }
    });
  </script>
</body>
</html>
```

## Development

### Project Structure
```
cka-radio-button/
├── src/
│   ├── components/
│   │   ├── cka-radio-button.ts
│   │   └── cka-radio-button.scss
│   ├── index.html
│   └── styles/
│       └── main.scss
├── dist/
│   ├── cka-radio-button.js
│   └── styles/
│       └── cka-radio-button.css
├── tsconfig.json
├── webpack.config.js
├── package.json
├── package-lock.json
└── README.md
```

### Build Scripts
The `package.json` includes several scripts to facilitate development and building:
```json
{
  "scripts": {
    "build": "webpack",
    "watch": "webpack --watch",
    "start": "webpack serve --open",
    "compile-scss": "sass src/ui-components/cka-radio-button.scss dist/styles/cka-radio-button.css"
  }
}
```

- `npm run build`: Compiles the TypeScript and SCSS files using Webpack.
- `npm run watch`: Watches for changes and automatically rebuilds them.
- `npm run start`: Starts Webpack Dev Server for live reloading.

To start the development server:
```bash
npm run start
```

## Customization

Modify SCSS variables in `cka-radio-button.scss` to change colors and styles.
```scss
$radio-primary-color: #007ad9;
$radio-hover-color: #005bb5;
$radio-text-color: #333;
$radio-disabled-color: #a8a8a8;
```

Example HTML with custom CSS variables:
```html
<style>
  cka-radio-button {
    --radio-primary-color: #28a745;
  }
</style>
```

## Accessibility

### Features
- Keyboard Navigation: Tab, Arrow keys, Spacebar.
- ARIA Attributes for screen readers.
- Focus Styles for better visibility.

Example of ARIA labels:
```html
<cka-radio-button name="group1" value="option1" checked aria-label="Option 1"></cka-radio-button>
```

## Contributing

### 1. Fork the Repository
Click the Fork button at the top right of the repository page.

### 2. Clone Your Fork
```bash
git clone https://github.com/yourusername/cka-radio-button.git
cd cka-radio-button
```

### 3. Create a New Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes and Commit
```bash
git commit -m "Add feature: your feature description"
```

### 5. Push and Create a Pull Request
```bash
git push origin feature/your-feature-name
```

Navigate to the original repository and create a pull request from your fork.

## License
This project is licensed under the MIT License.

