// alight-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import AlightLinkCommand from './alight-link-plugin-command';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

import './styles/alight-link-plugin.css';

// Represents the shape of `command.value` when set by AlightLinkCommand
interface AlightLinkValue {
  href: string;
}

// Shape of data returned from the modal
interface LinkData {
  href?: string;
}

export default class AlightLinkPluginUI extends Plugin {
  static get pluginName() {
    return 'AlightLinkPluginUI';
  }

  public init(): void {
    const editor = this.editor;
    const t = editor.t;

    // (Optional) Add a toolbar button for Insert/Edit Link
    editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
      const buttonView = createLinkFormView(locale, editor);

      buttonView.set({
        icon: ToolBarIcon,
        label: t('Insert/Edit Link'),
        tooltip: true,
        withText: true,
      });

      // If you want the toolbar button to open the modal as well:
      this.listenTo(buttonView, 'execute', () => {
        this.handleLinkButtonClick();
      });

      return buttonView;
    });
  }

  public afterInit(): void {
    const editor = this.editor;

    // Get the built-in LinkUI plugin, which manages the link balloon
    const linkUI = editor.plugins.get(LinkUI);
    if (!linkUI.actionsView) {
      return; // If there's no actionsView, stop
    }

    const actionsView = linkUI.actionsView;
    const editButtonView = actionsView.editButtonView;
    if (!editButtonView) {
      return; // If there's no 'edit link' button, stop
    }

    // Remove the default "execute" listener, which shows CKEditor's inline link form
    // THIS NEEDS TO BE FIXED
    // editButtonView.off('execute');

    // Attach our own listener, supplying the third argument to satisfy TS
    editButtonView.on(
      'execute',
      (evt, ...args) => {
        // Prevent the default inline form
        evt.stop();
        // Open our custom modal instead
        this.handleLinkButtonClick();
      },
      {} // <-- The third argument (options) to satisfy TS definitions
    );
  }

  /**
   * Retrieve the current link (if any) and open the modal with that URL.
   */
  private handleLinkButtonClick(): void {
    const editor = this.editor;
    const linkCommand = editor.commands.get('alightLinkPlugin') as AlightLinkCommand | undefined;
    if (!linkCommand) {
      return;
    }

    // AlightLinkCommand sets this.value = { href: string } or null
    const currentValue = linkCommand.value as AlightLinkValue | null;
    const currentHref = currentValue?.href ?? '';

    // Open modal, pre-filling the input
    this.openCustomModal(currentHref).then((linkData) => {
      if (linkData && linkData.href) {
        editor.execute('alightLinkPlugin', { href: linkData.href });
      }
    });
  }

  /**
   * Open your custom modal, returning a promise resolved with user input (or null if canceled).
   */
  private openCustomModal(defaultHref: string): Promise<LinkData | null> {
    const modal = new CustomModal();
    return modal.openModal(defaultHref);
  }
}

/**
 * A very basic custom modal class.
 * It creates an overlay, a modal box, and a single input for the URL.
 */
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

      // Create the main modal container
      this.modal = document.createElement('div');
      this.modal.classList.add('ck-custom-modal');

      // Header
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

      // Main section
      const mainEl = document.createElement('main');
      const hrefLabel = document.createElement('label');
      hrefLabel.innerText = 'URL';
      const hrefInput = document.createElement('input');
      hrefInput.type = 'text';
      hrefInput.placeholder = 'https://example.com';
      hrefInput.value = defaultHref; // Pre-fill with the existing link
      hrefLabel.appendChild(hrefInput);
      mainEl.appendChild(hrefLabel);

      // Footer
      const footerEl = document.createElement('footer');
      const cancelBtn = document.createElement('button');
      cancelBtn.classList.add('secondary');
      cancelBtn.innerText = 'Cancel';

      const continueBtn = document.createElement('button');
      continueBtn.classList.add('primary');
      continueBtn.innerText = 'Continue';

      footerEl.appendChild(cancelBtn);
      footerEl.appendChild(continueBtn);

      // Combine all parts
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

      // Close button
      closeBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Cancel button
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
        resolve(null);
      });

      // Continue button
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
    // Clean up DOM
    if (this.overlay) {
      document.body.removeChild(this.overlay);
    }
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }

    // Reset
    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }
}
