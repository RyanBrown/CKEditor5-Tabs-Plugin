# Alight Overlay Panel

A lightweight, dynamic overlay panel system built with **HTML, SCSS, and TypeScript**. This component enables modal-like overlay panels that appear dynamically near their triggering buttons while ensuring they remain within the viewport.

## Features

✅ **Dynamically positioned panels**  
✅ **Auto-adjusts to viewport space**  
✅ **Multiple panels with independent triggers**  
✅ **Supports resizing & click-outside behavior**  
✅ **Lightweight & dependency-free**

---

## 📥 Installation

Simply include the necessary **HTML, SCSS, and TypeScript** files in your project.

### 1️⃣ **Download the Files**

Clone this repository or manually copy the required files into your project.

```sh
git clone https://github.com/your-repo/alight-overlay-panel.git
```

### 2️⃣ **Include the Required Files**

Make sure your project has the necessary **HTML**, **SCSS**, and **TypeScript**.

#### **Option 1: Include via Script Tag**

Place the script in your HTML file **before the closing `</body>` tag**:

```html
<script src="alight-overlay-panel.js"></script>
```

#### **Option 2: Import in a TypeScript Project**

If using **TypeScript**, import the class:

```typescript
import { OverlayPanel } from './src/plugins/alight-overlay-panel/alight-overlay-panel';
```

Then initialize it:

```typescript
document.addEventListener('DOMContentLoaded', () => {
    new OverlayPanel();
});
```

---

## 🚀 Usage

### **1️⃣ Add Trigger Buttons**

Each button should have a unique `data-id` attribute.

```html
<button class="triggerBtn" data-id="1">Open Panel 1</button>
```

### **2️⃣ Create Overlay Panels**

Each panel should have the **same `data-id`** as its respective button.

```html
<div class="overlay-panel" data-id="1">
    <header>
        <span>Panel Title</span>
        <button class="closeBtn">Close</button>
    </header>
    <main>
        <p>This is a dynamic overlay panel.</p>
    </main>
    <footer>
        <button class="closeBtn">Close</button>
    </footer>
</div>
```

### **3️⃣ Initialize the Overlay Panel**

Make sure the TypeScript file runs on page load.

```typescript
document.addEventListener('DOMContentLoaded', () => {
    new OverlayPanel();
});
```

---

## 🎨 Customization

### **1️⃣ Style Customization**

Modify the SCSS in **`src/plugins/alight-overlay-panel/styles/alight-overlay-panel.scss`** to adjust the look and feel.

#### **Example: Change Background & Border**

```scss
.overlay-panel {
    background: #f9f9f9;
    border: 2px solid #007bff;
}
```

### **2️⃣ Modify Animation & Transitions**

The panel uses **opacity** and **visibility** for smooth fade-in/out animations. Adjust `transition` properties:

```scss
.overlay-panel {
    transition: opacity 0.5s ease, visibility 0.5s ease;
}
```

---

## 🛠️ Troubleshooting

### ❓ **Panel Doesn't Open**

✔️ Ensure the `data-id` of the **button** and **panel** match.  
✔️ Check if the TypeScript file is properly compiled and included in the console (`F12` → Console).  
✔️ Verify there are no `display: none;` or `visibility: hidden;` overrides in SCSS.

### ❓ **Panel Appears in the Wrong Position**

✔️ The panel adjusts based on available space—resize the window and test again.  
✔️ Ensure the panel is inside `<body>` and **not within a container with `overflow: hidden`**.  
✔️ Check for conflicting SCSS rules (e.g., `position: absolute;`).

---

## 📜 License

This project is **open-source** and available under the **MIT License**.

---

## 🤝 Contributing

We welcome contributions! Feel free to **submit pull requests** or **open issues** if you find bugs or have suggestions.

1. Fork the repository
2. Create a new branch (`feature/your-feature-name`)
3. Commit and push your changes
4. Submit a pull request

---

## 💬 Support & Questions

If you have any questions or need help, feel free to **open an issue** or **reach out**.  
Happy coding! 🚀✨
