// alight-link-plugin-ui.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';

// This is the built-in plugin that manages the link balloon UI
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';

import AlightLinkCommand from './alight-link-plugin-command';
import { createLinkFormView } from './alight-link-plugin-utils';
import ToolBarIcon from './assets/icon-link.svg';

// If you have a custom CSS file for your plugin:
import './styles/alight-link-plugin.css';

// Type describing the shape of the link command value
interface AlightLinkValue {
  href: string;
}

// Type describing data returned from your custom modal
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

    // (Optional) Add a toolbar button for Insert/Edit Link.
    editor.ui.componentFactory.add('alightLinkPlugin', (locale: Locale) => {
      const buttonView = createLinkFormView(locale, editor);

      buttonView.set({
        icon: ToolBarIcon,
        label: t('Insert/Edit Link'),
        tooltip: true,
        withText: true
      });

      // If desired, clicking this toolbar button also opens your modal.
      this.listenTo(buttonView, 'execute', () => {
        this.handleLinkButtonClick();
      });

      return buttonView;
    });
  }

  /**
   * afterInit() runs after all plugins (including LinkUI) have initialized.
   * This is where we override the balloon's default "Edit link" button behavior.
   */
  public afterInit(): void {
    const editor = this.editor;

    // 1. Get the built-in LinkUI plugin, which manages the balloon.
    const linkUI = editor.plugins.get(LinkUI);

    // 2. linkUI.actionsView => the container with class="ck ck-link-actions ck-responsive-form"
    //    This view holds the "Edit" button, the "Unlink" button, etc.
    if (!linkUI.actionsView) {
      return; // If there's no actionsView, bail out safely.
    }

    const actionsView = linkUI.actionsView;
    const editButtonView = actionsView.editButtonView;
    if (!editButtonView) {
      return; // If there's no "edit" button, bail out safely.
    }

    // 3. Remove ALL default "execute" listeners, which includes the inline form handler
    editButtonView.off('execute', () => { });


    // 4. Attach our own handler. Notice the third argument ({}) to satisfy TS strict definitions.
    editButtonView.on(
      'execute',
      (evt, ...args) => {
        // Stop the default balloon form from opening
        evt.stop();

        // Instead, call our function that opens the custom modal
        this.handleLinkButtonClick();
      },
      {}
    );
  }

  /**
   * handleLinkButtonClick():
   *  - Looks up the current link URL via our custom link command
   *  - Opens the custom modal prefilled with that URL
   *  - If user confirms, executes the link command with the updated URL
   */
  private handleLinkButtonClick(): void {
    const editor = this.editor;
    const linkCommand = editor.commands.get('alightLinkPlugin') as AlightLinkCommand | undefined;
    if (!linkCommand) {
      return;
    }

    // In your AlightLinkCommand, you set "this.value = { href } or null".
    const currentValue = linkCommand.value as AlightLinkValue | null;
    const currentHref = currentValue?.href ?? '';

    this.openCustomModal(currentHref).then(linkData => {
      // If user provided a link, execute the command
      if (linkData && linkData.href) {
        editor.execute('alightLinkPlugin', { href: linkData.href });
      }
    });
  }

  /**
   * Opens your custom modal, returning a promise that resolves with the new link data or null.
   */
  private openCustomModal(defaultHref: string): Promise<LinkData | null> {
    const modal = new CustomModal();
    return modal.openModal(defaultHref);
  }
}

/**
 * A very basic custom modal class, with a single text <input>.
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
      hrefInput.value = defaultHref; // Pre-fill with the current link
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

      // Assemble everything
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
    // Remove overlay
    if (this.overlay) {
      document.body.removeChild(this.overlay);
    }
    // Remove ESC listener
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }

    this.overlay = null;
    this.modal = null;
    this.keyDownHandler = null;
  }
}
