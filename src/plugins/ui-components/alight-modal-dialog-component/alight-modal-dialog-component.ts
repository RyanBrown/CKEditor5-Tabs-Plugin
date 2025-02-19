// src/plugins/ui-components/alight-modal-dialog-component/alight-modal-dialog-component.ts
import './styles/alight-modal-dialog-component.scss';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';

export interface DialogButton {
  disabled?: boolean;
  label: string;
  className?: string;
  variant?: 'default' | 'outlined' | 'text';
  closeOnClick?: boolean;
  isPrimary?: boolean;
  shape?: 'round' | 'default';
}

export interface DialogOptions {
  title?: string;
  modal?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  width?: string;
  height?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  closeOnEscape?: boolean;
  closeOnClick?: boolean;
  closeOnClickOutside?: boolean;
  overlayOpacity?: number;
  headerClass?: string;
  contentClass?: string;
  footerClass?: string;
  buttons?: DialogButton[];
  defaultCloseButton?: boolean;
  submitOnEnter?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export class CkAlightModalDialog {
  setProps(arg0: { title: string; width: string; height: string; okButtonText: string; cancelButtonText: string; okDisabled: boolean; onOk: () => { destination: string; title: string; } | null; }) {
    throw new Error('Method not implemented.');
  }
  private options: Required<DialogOptions>;
  private visible: boolean = false;
  private maximized: boolean = false;
  private initialPosition: Position = { x: 0, y: 0 };
  private initialSize: Size = { width: 0, height: 0 };
  private boundHandleEscape: (e: KeyboardEvent) => void;
  private boundHandleClickOutside: (e: MouseEvent) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private eventListeners: Map<string, Function[]> = new Map();
  private primaryButton: HTMLButtonElement | null = null;
  private focusTracker: FocusTracker;
  private keystrokes: KeystrokeHandler;

  // Initialize with ! to tell TypeScript these will be set in constructor
  private container!: HTMLDivElement;
  private overlay!: HTMLDivElement;
  private dialog!: HTMLDivElement;
  private header!: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private footer!: HTMLDivElement;

  constructor(options: DialogOptions = {}) {
    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    this.options = {
      title: 'button',
      modal: true,
      draggable: false,
      resizable: false,
      maximizable: false,
      width: '100%',
      height: 'auto',
      position: 'center',
      closeOnEscape: true,
      closeOnClick: false,
      closeOnClickOutside: false,
      overlayOpacity: 0.5,
      headerClass: '',
      contentClass: '',
      footerClass: '',
      buttons: [],
      defaultCloseButton: true,
      submitOnEnter: true,
      ...options
    };

    // Bind event handlers to maintain correct 'this' context
    this.boundHandleEscape = this.handleEscape.bind(this);
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    this.createDialog();
    this.setupEventListeners();

    if (this.options.title) {
      this.setTitle(this.options.title);
    }
  }

  private handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.visible && this.options.closeOnEscape) {
      this.hide();
      this.emit('close');
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && this.visible && this.options.submitOnEnter && this.primaryButton) {
      // Prevent form submission if the event originated from a textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'textarea' ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      e.preventDefault();
      this.primaryButton.click();
    }
  }

  private handleClickOutside(e: MouseEvent): void {
    if (!this.visible || !this.options.modal || !this.options.closeOnClickOutside) return;

    const target = e.target as HTMLElement;
    if (target && (target === this.overlay || target === this.container)) {
      this.hide();
      this.emit('close');
    }
  }

  private createDialog(): void {
    // Create main container with overlay
    this.container = document.createElement('div');
    this.container.className = 'cka-dialog-wrapper';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'cka-dialog-overlay';
    this.overlay.style.opacity = this.options.overlayOpacity.toString();

    // Create dialog content
    const content = `
      <div class="cka-dialog" style="width: ${this.options.width}; height: ${this.options.height};">
        <header class="cka-dialog-header ${this.options.draggable ? 'draggable' : ''} ${this.options.headerClass}">
          <span class="cka-dialog-title"></span>
          <div class="cka-dialog-header-icons">
            ${this.options.maximizable ? '<button class="cka-dialog-maximize" aria-label="Maximize"><i class="fa-regular fa-arrows-maximize"></i></button>' : ''}
            ${this.options.defaultCloseButton ? '<button class="cka-dialog-close" aria-label="Close"><i class="fa-regular fa-xmark"></i></button>' : ''}
          </div>
        </header>
        <main class="cka-dialog-content ${this.options.contentClass}"></main>
        <footer class="cka-dialog-footer ${this.options.footerClass}"></footer>
        ${this.options.resizable ? '<div class="cka-resizer"></div>' : ''}
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.container.innerHTML = content;
    document.body.appendChild(this.container);

    const dialogEl = this.container.querySelector('.cka-dialog');
    const headerEl = this.container.querySelector('.cka-dialog-header');
    const contentEl = this.container.querySelector('.cka-dialog-content');
    const footerEl = this.container.querySelector('.cka-dialog-footer');

    if (!dialogEl || !headerEl || !contentEl || !footerEl) {
      throw new Error('Failed to initialize dialog elements');
    }

    this.dialog = dialogEl as HTMLDivElement;
    this.header = headerEl as HTMLDivElement;
    this.contentEl = contentEl as HTMLDivElement;
    this.footer = footerEl as HTMLDivElement;

    this.setupButtons(this.options.buttons);
    this.hide();

    // Setup focus tracking
    this.focusTracker.add(this.dialog);
  }

  private setupButtons(buttons?: DialogButton[]): void {
    if (!buttons || buttons.length === 0) {
      return;
    }

    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    // Create and append each button
    buttons.forEach(buttonConfig => {
      const button = this.createButton(buttonConfig);

      // If button is disabled, set the attribute
      if (buttonConfig.disabled) {
        button.disabled = true;
      }

      footer.appendChild(button);
    });

    this.setFooter(footer);
  }

  // Update the createButton method in CkAlightModalDialog class
  private createButton(config: DialogButton): HTMLButtonElement {
    const button = document.createElement('button');
    let className = 'cka-button';  // Set base class by default

    // Add custom className if provided
    if (config.className) {
      className += ` ${config.className}`;
    }

    // Add variant class if specified
    if (config.variant) {
      className += ` cka-button-${config.variant}`;
    }

    // Add primary class if specified
    if (config.isPrimary) {
      className += ' cka-button-primary';
      this.primaryButton = button;
    }

    // Only add rounded class if specifically set to round
    if (config.shape === 'round') {
      className += ' cka-button-rounded';
    }

    button.className = className;
    button.textContent = config.label;
    button.onclick = () => {
      this.emit('buttonClick', config.label);
      if (config.closeOnClick !== false) {
        this.hide();
      }
    };
    return button;
  }

  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('.cka-dialog-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
        this.emit('close');
      });
    }

    // Maximize button
    if (this.options.maximizable) {
      const maxBtn = this.container.querySelector('.cka-dialog-maximize');
      if (maxBtn) {
        maxBtn.addEventListener('click', () => this.toggleMaximize());
      }
    }

    // Dragging
    if (this.options.draggable) {
      this.setupDragging();
    }

    // Resizing
    if (this.options.resizable) {
      this.setupResizing();
    }

    // Add global event listeners
    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.boundHandleEscape);
    }

    // Click outside
    if (this.options.modal) {
      document.addEventListener('mousedown', this.boundHandleClickOutside);
    }

    // Enter key submission
    if (this.options.submitOnEnter) {
      document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    // Setup keystroke handling
    this.keystrokes.listenTo(this.dialog);
  }

  private setupDragging(): void {
    if (!this.options.draggable) return;

    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    const handleMouseDown = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;
      if (e.target instanceof Element && e.target.closest('.cka-dialog-header-icons')) return;

      isDragging = true;
      const rect = this.dialog.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

      // Add grabbing class for cursor style
      this.header.classList.add('grabbing');

      // Remove the centering transform when starting to drag
      this.dialog.style.transform = 'none';
    };

    const handleMouseMove = (e: Event) => {
      if (!(e instanceof MouseEvent) || !isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      this.dialog.style.left = `${currentX}px`;
      this.dialog.style.top = `${currentY}px`;
    };

    const handleMouseUp = () => {
      isDragging = false;
      // Remove grabbing class
      this.header.classList.remove('grabbing');
    };

    this.header.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  private setupResizing(): void {
    let isResizing = false;
    let initialWidth: number;
    let initialHeight: number;
    let initialX: number;
    let initialY: number;

    const resizer = this.container.querySelector('.cka-resizer');
    if (!resizer) return;

    const handleMouseDown = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;

      isResizing = true;
      initialWidth = this.dialog.offsetWidth;
      initialHeight = this.dialog.offsetHeight;
      initialX = e.clientX;
      initialY = e.clientY;

      // Remove the centering transform when starting to resize
      this.dialog.style.transform = 'none';
    };

    const handleMouseMove = (e: Event) => {
      if (!(e instanceof MouseEvent) || !isResizing) return;

      e.preventDefault();
      const width = initialWidth + (e.clientX - initialX);
      const height = initialHeight + (e.clientY - initialY);

      this.dialog.style.width = `${width}px`;
      this.dialog.style.height = `${height}px`;
    };

    const handleMouseUp = () => {
      isResizing = false;
    };

    resizer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  public show(): void {
    this.visible = true;
    this.overlay.style.display = 'block';
    this.container.style.display = 'block';

    // Reset transform for initial centered position
    this.dialog.style.transform = 'translate(-50%, -50%)';
    this.dialog.style.top = '50%';
    this.dialog.style.left = '50%';

    this.emit('show');
    this.focus();
  }

  public hide(): void {
    this.visible = false;
    this.overlay.style.display = 'none';
    this.container.style.display = 'none';
    this.emit('hide');
  }

  public destroy(): void {
    this.focusTracker.destroy();
    this.keystrokes.destroy();

    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
    }
    if (this.options.modal) {
      document.removeEventListener('mousedown', this.boundHandleClickOutside);
    }
    if (this.options.submitOnEnter) {
      document.removeEventListener('keydown', this.boundHandleKeyDown);
    }

    // Remove elements
    this.overlay.remove();
    this.container.remove();
  }

  public setContent(content: string | Node): void {
    this.contentEl.innerHTML = '';  // Clear existing content

    if (typeof content === 'string') {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = content;
      // Append each child node individually to preserve event listeners
      while (tempContainer.firstChild) {
        this.contentEl.appendChild(tempContainer.firstChild);
      }
    } else if (content instanceof Node) {
      this.contentEl.appendChild(content);
    }
  }

  public setTitle(title: string): void {
    const titleEl = this.container.querySelector('.cka-dialog-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  public setFooter(content: string | Node): void {
    if (typeof content === 'string') {
      this.footer.innerHTML = content;
    } else if (content instanceof Node) {
      this.footer.innerHTML = '';
      this.footer.appendChild(content);
    }
  }

  public toggleMaximize(): void {
    if (this.maximized) {
      // Restore previous position and size
      this.dialog.style.transform = 'translate(-50%, -50%)';
      this.dialog.style.top = '50%';
      this.dialog.style.left = '50%';
      this.dialog.style.width = `${this.initialSize.width}px`;
      this.dialog.style.height = `${this.initialSize.height}px`;
      this.maximized = false;
    } else {
      // Store current size before maximizing
      this.initialSize = {
        width: this.dialog.offsetWidth,
        height: this.dialog.offsetHeight
      };

      // Maximize
      this.dialog.style.transform = 'none';
      this.dialog.style.top = '0';
      this.dialog.style.left = '0';
      this.dialog.style.width = '100vw';
      this.dialog.style.height = '100vh';
      this.maximized = true;
    }
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isMaximized(): boolean {
    return this.maximized;
  }

  // Additional methods from ModalView
  public focus(): void {
    this.dialog?.focus();
  }

  // Event handling methods
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  // Getter for the dialog element
  public get element(): HTMLElement | null {
    return this.dialog || null;
  }

  // Getter for the content element
  public getContentElement(): HTMLElement | null {
    return this.contentEl || null;
  }
}

export default CkAlightModalDialog;