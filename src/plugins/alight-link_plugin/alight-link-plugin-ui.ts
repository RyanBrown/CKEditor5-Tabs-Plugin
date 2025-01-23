// alight-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

import './styles/alight-link-plugin.css';

// Import the custom command so we can use it for proper type assertions.
import AlightLinkCommand from './alight-link-plugin-command';

/**
 * If you want to reference the shape of `command.value` from `AlightLinkCommand`,
 * recall that in your AlightLinkCommand:
 *
 *   this.value = href ? { href } : null;
 *
 * This means `value` is either `null` or `{ href: string }`.
 * We'll define a small type for convenience:
 */
interface AlightLinkValue {
  href: string;
}

export default class AlightLinkPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkPluginUI';
  }

  init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Create a button for inserting/editing links.
    editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
      const buttonView = createLinkFormView(locale, editor);

      buttonView.set({
        icon: ToolBarIcon,
        label: t('Insert/Edit Link'),
        tooltip: true,
        withText: true,
      });

      // Listen for button clicks.
      this.listenTo(buttonView, 'execute', () => {
        // Safely retrieve our custom link command. Type assertion ensures we treat it as AlightLinkCommand.
        const linkCommand = editor.commands.get('alightLinkPlugin') as AlightLinkCommand | undefined;

        // If for some reason the command is not registered, gracefully exit or handle the error.
        if (!linkCommand) {
          // You could display an error, throw, or just return:
          return;
        }

        // Since AlightLinkCommand sets `this.value = href ? { href } : null;`,
        // `linkCommand.value` could be null or { href: string }.
        const currentValue = linkCommand.value as AlightLinkValue | null;
        const currentHref = currentValue?.href ?? '';

        // Now open the modal, passing in the existing URL.
        this.openCustomModal(currentHref).then((linkData: LinkData | null) => {
          if (linkData) {
            const { href } = linkData;
            editor.execute('alightLinkPlugin', { href });
          }
        });
      });

      return buttonView;
    });
  }

  // Pass defaultHref so that the modal can be pre-filled.
  private openCustomModal(defaultHref: string): Promise<LinkData | null> {
    const modal = new CustomModal();
    return modal.openModal(defaultHref);
  }
}

// Define LinkData to match what's returned by the modal
interface LinkData {
  href?: string;
}

class CustomModal {
  private overlay: HTMLDivElement | null;
  private modal: HTMLDivElement | null;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null;

  constructor() {
    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }

  public openModal(defaultHref: string): Promise<LinkData | null> {
    return new Promise((resolve) => {
      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.classList.add('ck-custom-modal-overlay');

      // Create the modal container
      this.modal = document.createElement('div');
      this.modal.classList.add('ck-custom-modal');

      // Build header
      const headerEl = document.createElement('header');
      const titleSpan = document.createElement('span');
      titleSpan.classList.add('modal-title');
      titleSpan.innerText = 'Insert/Edit Link';

      const headerRightDiv = document.createElement('div');
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('header-close');
      closeBtn.innerText = '×';

      headerRightDiv.appendChild(closeBtn);
      headerEl.appendChild(titleSpan);
      headerEl.appendChild(headerRightDiv);

      // Build main section
      const mainEl = document.createElement('main');

      // URL field
      const hrefLabel = document.createElement('label');
      hrefLabel.innerText = 'URL';
      const hrefInput = document.createElement('input');
      hrefInput.type = 'text';
      hrefInput.placeholder = 'https://example.com';
      hrefInput.value = defaultHref; // Pre-fill the input field
      hrefLabel.appendChild(hrefInput);

      mainEl.appendChild(hrefLabel);

      // Build footer
      const footerEl = document.createElement('footer');

      const cancelBtn = document.createElement('button');
      cancelBtn.classList.add('secondary');
      cancelBtn.innerText = 'Cancel';

      const continueBtn = document.createElement('button');
      continueBtn.classList.add('primary');
      continueBtn.innerText = 'Continue';

      footerEl.appendChild(cancelBtn);
      footerEl.appendChild(continueBtn);

      // Append all parts
      this.modal.appendChild(headerEl);
      this.modal.appendChild(mainEl);
      this.modal.appendChild(footerEl);
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

      // Close button action
      closeBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Cancel button action
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Continue button action
      continueBtn.addEventListener('click', () => {
        const data: LinkData = {
          href: hrefInput.value.trim(),
        };
        this.closeModal();

        if (!data.href) {
          resolve(null);
        } else {
          resolve(data);
        }
      });
    });
  }

  private closeModal(): void {
    if (this.overlay) {
      document.body.removeChild(this.overlay);
    }
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }
}
