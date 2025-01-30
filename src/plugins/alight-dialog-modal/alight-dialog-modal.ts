// src/plugins/alight-dialog-modal/alight-dialog-modal.ts
import './styles/alight-dialog-modal.scss';
import DOMPurify from 'dompurify';

/**
 * A generic modal that can be used for any plugin or feature.
 * Receives all content and callbacks in props, no assumptions about "images," "links," etc.
 */
export interface AlightDialogModalProps {
  title?: string; // Optional modal title with a default value
  tertiaryButton?: {
    label?: string; // Optional label with a default value
    onClick?: () => void; // Optional function for cancel button click
  };
  primaryButton?: {
    label?: string; // Optional label with a default value
    onClick?: () => void; // Optional function for accept button click
  };
  content?: HTMLElement | string; // Optional modal content with a default value
  contentClass?: string; // Optional class for styling the content container
  onClose?: () => void; // Callback for closing the modal
  showHeader?: boolean; // Show or hide the header (default: true)
  showFooter?: boolean; // Show or hide the footer (default: true)
  maxWidth?: string | null; // Optional max-width with a default value of null
  minWidth?: string | null; // Optional min-width with a default value of null
  width?: string | null; // Optional width with a default value of null
}

export class AlightDialogModal {
  private overlay: HTMLElement;
  private modal: HTMLElement;
  private onCloseCallback: () => void;
  private contentContainer!: HTMLElement; // Initialized in constructor

  constructor({
    title = 'Modal Title',
    tertiaryButton = { label: 'Cancel', onClick: () => this.closeModal() },
    primaryButton = { label: 'Continue', onClick: () => { } },
    content = 'Placeholder content',
    contentClass = '',
    onClose = () => { },
    showHeader = true,
    showFooter = true,
    maxWidth = null,
    minWidth = null,
    width = null,
  }: AlightDialogModalProps) {
    this.onCloseCallback = onClose;

    // Create the overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'ck ck-dialog-overlay';
    this.overlay.tabIndex = -1;

    // Create the modal container
    this.modal = document.createElement('div');
    this.modal.className = 'ck ck-dialog ck-dialog_modal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-label', title);
    this.modal.style.top = '50%';
    this.modal.style.left = '50%';
    this.modal.style.transform = 'translate(-50%, -50%)';

    // Apply width properties if provided
    if (maxWidth) this.modal.style.maxWidth = maxWidth;
    if (minWidth) this.modal.style.minWidth = minWidth;
    if (width) this.modal.style.width = width;

    // Modal header
    if (showHeader) {
      const header = document.createElement('div');
      header.className = 'ck ck-form__header';

      const titleElement = document.createElement('h2');
      titleElement.className = 'ck ck-form__header__label';
      titleElement.textContent = title;

      const closeButton = document.createElement('button');
      closeButton.className = 'ck ck-button ck-off';
      closeButton.type = 'button';
      closeButton.innerHTML = `
        <svg class="ck ck-icon ck-reset_all-excluded ck-icon_inherit-color ck-button__icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="m11.591 10.177 4.243 4.242a1 1 0 0 1-1.415 1.415l-4.242-4.243-4.243 4.243a1 1 0 0 1-1.414-1.415l4.243-4.242L4.52 5.934A1 1 0 0 1 5.934 4.52l4.243 4.243 4.242-4.243a1 1 0 1 1 1.415 1.414l-4.243 4.243z"></path>
        </svg>
      `;
      closeButton.onclick = () => this.closeModal(); // Fixed: no arguments

      header.appendChild(titleElement);
      header.appendChild(closeButton);
      this.modal.appendChild(header);
    }

    // Modal content
    this.contentContainer = document.createElement('div'); // Initialize
    this.contentContainer.className = `ck ck-dialog__content ${contentClass}`;
    this.setContent(content, this.contentContainer); // set initial content
    this.modal.appendChild(this.contentContainer);

    // Modal actions (footer)
    if (showFooter) {
      const actions = document.createElement('div');
      actions.className = 'ck ck-dialog__actions';

      // Tertiary (cancel) button
      const tertiaryButtonElement = document.createElement('button');
      tertiaryButtonElement.className = 'ck ck-button ck-button_with-text';
      tertiaryButtonElement.type = 'button';
      tertiaryButtonElement.textContent = tertiaryButton.label ?? 'Cancel';
      tertiaryButtonElement.onclick = () => {
        if (tertiaryButton.onClick) {
          tertiaryButton.onClick();
        }
        this.closeModal(); // Correct
      };

      // Primary (accept) button
      const primaryButtonElement = document.createElement('button');
      primaryButtonElement.className = 'ck ck-button ck-button-action ck-off ck-button_with-text';
      primaryButtonElement.type = 'button';
      primaryButtonElement.textContent = primaryButton.label ?? 'Continue';
      primaryButtonElement.onclick = primaryButton.onClick || (() => { });

      actions.appendChild(tertiaryButtonElement);
      actions.appendChild(primaryButtonElement);

      this.modal.appendChild(actions);
    }

    // Add modal to overlay
    this.overlay.appendChild(this.modal);

    // Add overlay to the body
    document.body.appendChild(this.overlay);

    // Add escape key listener
    document.addEventListener('keydown', this.handleKeydown);
  }

  /**
   * Sets the content of the modal.
   * If content is a string, it sets innerHTML and executes any embedded scripts.
   * If content is an HTMLElement, it appends it directly.
   * @param content - The content to set (string or HTMLElement)
   * @param container - The container element to set the content in
   */
  private setContent(content: HTMLElement | string, container: HTMLElement): void {
    if (typeof content === 'string') {
      const sanitizedContent = DOMPurify.sanitize(content);
      container.innerHTML = sanitizedContent;
      this.executeEmbeddedScripts(container);
    } else if (content instanceof HTMLElement) {
      container.appendChild(content);
      this.executeEmbeddedScripts(content);
    }
  }

  /**
   * Finds and executes any <script> tags within the given container.
   * @param container - The element to search for scripts within
   */
  private executeEmbeddedScripts(container: HTMLElement): void {
    const scripts = container.querySelectorAll('script');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      // Copy attributes
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (script.src) {
        newScript.src = script.src;
        // To handle async script loading
        newScript.onload = () => { /* Optional: handle script load */ };
      } else {
        newScript.textContent = script.textContent || '';
      }

      // Replace the old script with the new one to execute it
      script.parentNode?.replaceChild(newScript, script);
    });
  }

  /**
   * Public method to update the modal's content dynamically.
   * @param content - The new content to set (string or HTMLElement)
   */
  public updateContent(content: HTMLElement | string): void {
    this.contentContainer.innerHTML = ''; // Clear existing content
    this.setContent(content, this.contentContainer);
  }

  public show(): void {
    // Ensure it's appended; in case the user re-shows the same modal instance
    if (!document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
    this.overlay.style.display = 'block';
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  };

  public closeModal(): void {
    // Clean up DOM
    if (document.body.contains(this.overlay)) {
      document.body.removeChild(this.overlay);
    }
    document.removeEventListener('keydown', this.handleKeydown);

    // Fire the callback
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
}
