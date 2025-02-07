// src/plugins/ui-components/alight-modal-dialog-component/alight-modal-dialog-component.ts
import './styles/alight-modal-dialog-component.scss';

export interface DialogButton {
  label: string;
  className: string;
  variant?: 'default' | 'outlined' | 'text';
  position?: 'left' | 'right';
  closeOnClick?: boolean;
}

export interface DialogOptions {
  modal?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  width?: string;
  height?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  overlayOpacity?: number;
  headerClass?: string;
  contentClass?: string;
  footerClass?: string;
  buttons?: DialogButton[];
  defaultCloseButton?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export class CKAlightModalDialog {
  private options: Required<DialogOptions>;
  private visible: boolean = false;
  private maximized: boolean = false;
  private initialPosition: Position = { x: 0, y: 0 };
  private initialSize: Size = { width: 0, height: 0 };
  private boundHandleEscape: (e: KeyboardEvent) => void;
  private boundHandleClickOutside: (e: MouseEvent) => void;
  private eventListeners: Map<string, Function[]> = new Map();

  // Initialize with ! to tell TypeScript these will be set in constructor
  private container!: HTMLDivElement;
  private overlay!: HTMLDivElement;
  private dialog!: HTMLDivElement;
  private header!: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private footer!: HTMLDivElement;

  constructor(options: DialogOptions = {}) {
    this.options = {
      modal: true,
      draggable: false,
      resizable: false,
      maximizable: false,
      width: '50vw',
      height: 'auto',
      position: 'center',
      closeOnEscape: true,
      closeOnClickOutside: false,
      overlayOpacity: 0.5,
      headerClass: '',
      contentClass: '',
      footerClass: '',
      buttons: [],
      defaultCloseButton: true,
      ...options
    };

    // Bind event handlers to maintain correct 'this' context
    this.boundHandleEscape = this.handleEscape.bind(this);
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);

    this.createDialog();
    this.setupEventListeners();
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  public getContentElement(): HTMLElement | null {
    return this.contentEl || null;
  }

  private handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.visible && this.options.closeOnEscape) {
      this.hide();
      this.emit('close');
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
        <div class="cka-dialog-header ${this.options.draggable ? 'draggable' : ''} ${this.options.headerClass}">
          <span class="cka-dialog-title"></span>
          <div class="cka-dialog-header-icons">
            ${this.options.maximizable ? '<button class="cka-dialog-maximize" aria-label="Maximize"><i class="cka-maximize-icon"></i></button>' : ''}
            <button class="cka-dialog-close" aria-label="Close"><i class="cka-close-icon"></i></button>
          </div>
        </div>
        <div class="cka-dialog-content ${this.options.contentClass}"></div>
        <div class="cka-dialog-footer ${this.options.footerClass}"></div>
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
  }

  private setupButtons(buttons?: DialogButton[]): void {
    const footer = document.createElement('div');
    footer.className = 'cka-dialog-footer-buttons';

    if (buttons?.length) {
      const leftButtons = buttons.filter(btn => btn.position === 'left');
      const rightButtons = buttons.filter(btn => btn.position !== 'left');

      if (leftButtons.length) {
        const leftGroup = document.createElement('div');
        leftGroup.className = 'cka-dialog-footer-left';
        leftButtons.forEach(buttonConfig => {
          leftGroup.appendChild(this.createButton(buttonConfig));
        });
        footer.appendChild(leftGroup);
      }

      if (rightButtons.length) {
        const rightGroup = document.createElement('div');
        rightGroup.className = 'cka-dialog-footer-right';
        rightButtons.forEach(buttonConfig => {
          rightGroup.appendChild(this.createButton(buttonConfig));
        });
        footer.appendChild(rightGroup);
      }
    }

    this.setFooter(footer);
  }

  private createButton(config: DialogButton): HTMLButtonElement {
    const button = document.createElement('button');
    let className = config.className;
    if (config.variant) {
      className += ` cka-button-${config.variant}`;
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
      closeBtn.addEventListener('click', () => this.hide());
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

    // Trigger show event
    this.container.dispatchEvent(new CustomEvent('show'));
  }

  public hide(): void {
    this.visible = false;
    this.overlay.style.display = 'none';
    this.container.style.display = 'none';

    // Trigger hide event
    this.container.dispatchEvent(new CustomEvent('hide'));
  }

  public destroy(): void {
    // Remove event listeners
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
    }
    if (this.options.modal) {
      document.removeEventListener('mousedown', this.boundHandleClickOutside);
    }

    // Remove elements
    this.overlay.remove();
    this.container.remove();
  }

  // Rest of the methods remain the same...
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
}

export default CKAlightModalDialog;