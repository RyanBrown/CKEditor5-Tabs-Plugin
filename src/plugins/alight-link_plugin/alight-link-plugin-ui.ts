// alight-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If your bundler supports direct CSS imports, uncomment below:
import './styles/alight-link-plugin.css';

export default class AlightLinkPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkPluginUI';
  }

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

        // Open our custom modal (vanilla TypeScript)
        this.openCustomModal().then((linkData: LinkData | null) => {
          if (linkData) {
            const { href } = linkData;
            // Execute the command with the retrieved properties
            editor.execute('alightLinkPlugin', { href });
          }
        });
      });

      return buttonView;
    });
  }

  // Opens the custom modal, returning a Promise of LinkData or null.
  private openCustomModal(): Promise<LinkData | null> {
    const modal = new CustomModal();
    return modal.openModal();
  }
}

// An interface describing the shape of data returned by the modal.
interface LinkData {
  href?: string;
}

class CustomModal {
  private overlay: HTMLDivElement | null;
  private modal: HTMLDivElement | null;

  // We'll store references to remove them later
  private keyDownHandler: ((e: KeyboardEvent) => void) | null;

  constructor() {
    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }

  public openModal(): Promise<LinkData | null> {
    return new Promise((resolve) => {
      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.classList.add('ck-custom-modal-overlay');

      // Create the main modal container
      this.modal = document.createElement('div');
      this.modal.classList.add('ck-custom-modal');

      // Build the header
      const headerEl = document.createElement('header');
      const titleSpan = document.createElement('span');
      titleSpan.classList.add('modal-title');
      titleSpan.innerText = 'Insert Link';

      const headerRightDiv = document.createElement('div');
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('header-close');
      closeBtn.innerText = '×';

      headerRightDiv.appendChild(closeBtn);
      headerEl.appendChild(titleSpan);
      headerEl.appendChild(headerRightDiv);

      // Build the main section
      const mainEl = document.createElement('main');

      // URL field
      const hrefLabel = document.createElement('label');
      hrefLabel.innerText = 'URL';
      const hrefInput = document.createElement('input');
      hrefInput.type = 'text';
      hrefInput.placeholder = 'https://example.com';
      hrefLabel.appendChild(hrefInput);

      mainEl.appendChild(hrefLabel);

      // Build the footer
      const footerEl = document.createElement('footer');

      // Cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.classList.add('secondary');
      cancelBtn.innerText = 'Cancel';

      // Continue (save) button
      const continueBtn = document.createElement('button');
      continueBtn.classList.add('primary'); // spelled as requested
      continueBtn.innerText = 'Continue';

      footerEl.appendChild(cancelBtn);
      footerEl.appendChild(continueBtn);

      // Append header, main, footer to modal
      this.modal.appendChild(headerEl);
      this.modal.appendChild(mainEl);
      this.modal.appendChild(footerEl);

      // Append modal to overlay
      this.overlay.appendChild(this.modal);
      document.body.appendChild(this.overlay);

      // Listen for ESC key
      this.keyDownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.closeModal();
          resolve(null);
        }
      };
      window.addEventListener('keydown', this.keyDownHandler);

      // Handle the "header-close" (the "×" button)
      closeBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Handle the "Cancel" button
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Handle the "Continue" button
      continueBtn.addEventListener('click', () => {
        const data: LinkData = {
          href: hrefInput.value.trim(),
        };
        this.closeModal();

        // If the user didn't provide any HREF, treat that as null
        if (!data.href) {
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  }

  private closeModal(): void {
    // Remove overlay from the DOM
    if (this.overlay) {
      document.body.removeChild(this.overlay);
    }
    // Remove the keydown event listener
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }

    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }
}
