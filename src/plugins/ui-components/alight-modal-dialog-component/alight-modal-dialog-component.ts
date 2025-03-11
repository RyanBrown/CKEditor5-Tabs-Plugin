// src/plugins/ui-components/alight-modal-dialog-component/alight-modal-dialog-component.ts
import './styles/alight-modal-dialog-component.scss';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import { AlightPositionManager } from '../alight-ui-component-utils/alight-position-manager';

export interface DialogButton {
  disabled?: boolean;
  label: string;
  className?: string;
  variant?: 'default' | 'outlined' | 'text';
  closeOnClick?: boolean;
  isPrimary?: boolean;
  shape?: 'round' | 'default';
  icon?: string; // PrimeNG-like icon support
  iconPos?: 'left' | 'right'; // PrimeNG-like icon position
  loading?: boolean; // PrimeNG-like loading state
  onClick?: (event: MouseEvent) => void; // Callback function
}

export interface DialogOptions {
  id?: string; // Added unique ID support
  title?: string;
  modal?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  width?: string;
  height?: string;
  style?: Partial<CSSStyleDeclaration>; // PrimeNG-like style object
  styleClass?: string; // PrimeNG-like style class
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  closeOnEscape?: boolean;
  closeOnClick?: boolean;
  dismissableMask?: boolean; // PrimeNG name for closeOnClickOutside
  closeOnClickOutside?: boolean; // For backward compatibility
  baseZIndex?: number; // PrimeNG property
  autoZIndex?: boolean; // PrimeNG property
  showHeader?: boolean; // PrimeNG property
  breakpoints?: Record<string, string>; // PrimeNG responsive breakpoints
  headerClass?: string;
  contentClass?: string;
  footerClass?: string;
  buttons?: DialogButton[];
  defaultCloseButton?: boolean;
  submitOnEnter?: boolean;
  transitionOptions?: string; // PrimeNG animation options
  appendTo?: 'body' | string | HTMLElement; // PrimeNG appendTo option
  onOpen?: () => void; // For backward compatibility
  onClose?: () => void; // For backward compatibility
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
  private options: Required<DialogOptions>;
  private visible: boolean = false;
  private maximized: boolean = false;
  private initialPosition: Position = { x: 0, y: 0 };
  private initialSize: Size = { width: 0, height: 0 };
  private boundHandleEscape: (e: KeyboardEvent) => void;
  private boundHandleClickOutside: (e: MouseEvent) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleWindowResize: () => void;
  private eventListeners: Map<string, Function[]> = new Map();
  private primaryButton: HTMLButtonElement | null = null;
  private focusTracker: FocusTracker;
  private keystrokes: KeystrokeHandler;
  private uniqueId: string;
  private positionManager: AlightPositionManager;

  // DOM elements
  private container!: HTMLDivElement;
  private overlay!: HTMLDivElement;
  private dialog!: HTMLDivElement;
  private header!: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private footer!: HTMLDivElement;

  // Added for PrimeNG-like behavior
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private dragOffset: Position = { x: 0, y: 0 };
  private resizeStart: { mousePos: Position, size: Size } = {
    mousePos: { x: 0, y: 0 },
    size: { width: 0, height: 0 }
  };
  private originalStyles = { width: '', height: '', left: '', top: '' };
  private isDestroyed: boolean = false;
  private zIndex: number = 1000;

  // For tracking focus return after dialog closes
  private previousActiveElement: Element | null = null;

  // Track if DOM elements have been added to document
  private isAddedToDOM: boolean = false;

  // Public property to maintain backward compatibility
  public element: HTMLElement | null = null;

  constructor(options: DialogOptions = {}) {
    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();
    this.positionManager = AlightPositionManager.getInstance();
    this.uniqueId = options.id || 'dialog-' + Math.random().toString(36).substr(2, 9);

    // Handle backward compatibility for closeOnClickOutside
    if (options.closeOnClickOutside !== undefined && options.dismissableMask === undefined) {
      options.dismissableMask = options.closeOnClickOutside;
    }

    // Default options with PrimeNG-like defaults
    this.options = {
      id: this.uniqueId,
      title: 'Modal Title',
      modal: true,
      draggable: false,
      resizable: false,
      maximizable: false,
      width: '50vw', // PrimeNG default
      height: 'auto',
      style: {},
      styleClass: '',
      position: 'center',
      closeOnEscape: true,
      closeOnClick: false,
      dismissableMask: false, // PrimeNG default is true
      closeOnClickOutside: true, // For backward compatibility
      headerClass: '',
      contentClass: '',
      footerClass: '',
      buttons: [],
      defaultCloseButton: true,
      submitOnEnter: true,
      baseZIndex: 0,
      autoZIndex: true,
      showHeader: true,
      breakpoints: {},
      transitionOptions: '150ms cubic-bezier(0, 0, 0.2, 1)',
      appendTo: 'body',
      onOpen: () => { }, // For backward compatibility
      onClose: () => { }, // For backward compatibility
      ...options
    };

    // Bind event handlers to maintain correct 'this' context
    this.boundHandleEscape = this.handleEscape.bind(this);
    this.boundHandleClickOutside = this.handleClickOutside.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleWindowResize = this.handleWindowResize.bind(this);

    // Create DOM elements but don't add to document yet
    this.createDialog();
    this.setupEventListeners();

    if (this.options.title) {
      this.setTitle(this.options.title);
    }

    // Make sure dialog is hidden initially
    this._hideWithoutAnimation();
  }

  // Method to update dialog properties (API similar to PrimeNG)
  public setProps(props: Partial<DialogOptions & {
    okButtonText?: string;
    cancelButtonText?: string;
    okDisabled?: boolean;
    onOk?: () => any;
  }>): void {
    // Handle specific props that need special treatment
    if (props.title !== undefined) {
      this.setTitle(props.title);
    }

    if (props.width !== undefined || props.height !== undefined) {
      this.setSize(props.width || this.options.width, props.height || this.options.height);
    }

    // Handle custom buttons from older API
    if (props.okButtonText || props.cancelButtonText) {
      const buttons: DialogButton[] = [];

      if (props.cancelButtonText) {
        buttons.push({
          label: props.cancelButtonText,
          variant: 'outlined',
          shape: 'round',
          closeOnClick: true
        });
      }

      if (props.okButtonText) {
        buttons.push({
          label: props.okButtonText,
          variant: 'default',
          shape: 'round',
          isPrimary: true,
          disabled: props.okDisabled,
          onClick: props.onOk ? (e) => {
            const result = props.onOk!();
            if (result) {
              this.hide();
            }
          } : undefined
        });
      }

      if (buttons.length) {
        this.setupButtons(buttons);
      }
    }

    // Update other options
    this.options = {
      ...this.options,
      ...props
    };

    // Apply style updates if any
    if (props.style && this.dialog) {
      Object.assign(this.dialog.style, props.style);
    }

    // Apply class updates if any
    if (props.styleClass !== undefined && this.dialog) {
      // Remove old classes
      if (this.options.styleClass) {
        this.dialog.classList.remove(...this.options.styleClass.split(' '));
      }

      // Add new classes
      if (props.styleClass) {
        this.dialog.classList.add(...props.styleClass.split(' '));
      }
    }

    // Update draggable state
    if (props.draggable !== undefined && this.header) {
      if (props.draggable) {
        this.setupDragging();
      } else {
        this.header.classList.remove('draggable');
      }
    }

    // Update resizable state
    if (props.resizable !== undefined && this.dialog) {
      const resizer = this.dialog.querySelector('.cka-resizer');
      if (resizer) {
        resizer.classList.toggle('cka-hidden', !props.resizable);
      }
    }
  }

  private handleEscape(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.visible && this.options.closeOnEscape) {
      this.hide();
      this.emit('close', { originalEvent: e });
      e.preventDefault(); // Prevent other escape handlers (PrimeNG behavior)
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
    if (!this.visible || !this.options.modal ||
      (!this.options.dismissableMask && !this.options.closeOnClickOutside)) return;

    const target = e.target as HTMLElement;
    if (target && (target === this.overlay || target === this.container)) {
      this.hide();
      this.emit('close', { originalEvent: e, type: 'outside' });
    }
  }

  // Handle window resize (PrimeNG behavior)
  private handleWindowResize(): void {
    if (!this.visible || this.isDestroyed) return;

    // Check if dialog is outside viewport and reposition if needed
    if (!this.maximized) {
      this.enforceBoundaries();
    }

    // Check breakpoints for responsive sizing (PrimeNG feature)
    this.checkBreakpoints();
  }

  // Enforce dialog stays within viewport boundaries
  private enforceBoundaries(): void {
    if (!this.dialog) return;

    const dialogRect = this.dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Don't allow dialog to go off-screen
    if (dialogRect.right > viewportWidth) {
      this.dialog.style.left = Math.max(0, viewportWidth - dialogRect.width) + 'px';
    }

    if (dialogRect.bottom > viewportHeight) {
      this.dialog.style.top = Math.max(0, viewportHeight - dialogRect.height) + 'px';
    }

    if (dialogRect.left < 0) {
      this.dialog.style.left = '0px';
    }

    if (dialogRect.top < 0) {
      this.dialog.style.top = '0px';
    }
  }

  // Check and apply responsive breakpoints (PrimeNG feature)
  private checkBreakpoints(): void {
    if (!this.options.breakpoints || Object.keys(this.options.breakpoints).length === 0) {
      return;
    }

    const windowWidth = window.innerWidth;

    // Find applicable breakpoint
    const sortedBreakpoints = Object.entries(this.options.breakpoints)
      .map(([width, value]) => ({ width: parseInt(width), value }))
      .sort((a, b) => b.width - a.width); // Sort descending

    for (const breakpoint of sortedBreakpoints) {
      if (windowWidth <= breakpoint.width) {
        // Apply breakpoint width
        this.dialog.style.width = breakpoint.value;

        // Recenter dialog
        if (this.options.position === 'center') {
          this.centerDialog();
        }

        return;
      }
    }

    // If no breakpoint applies, restore original width
    if (!this.maximized) {
      this.dialog.style.width = this.options.width;

      // Recenter dialog
      if (this.options.position === 'center') {
        this.centerDialog();
      }
    }
  }

  // Center dialog in viewport (PrimeNG helper)
  private centerDialog(): void {
    if (!this.dialog || this.maximized) return;

    this.dialog.style.left = '50%';
    this.dialog.style.top = '50%';
    this.dialog.style.transform = 'translate(-50%, -50%)';
  }

  private createDialog(): void {
    // Create main container (mask)
    this.container = document.createElement('div');
    this.container.className = 'cka-dialog-wrapper';
    this.container.id = `${this.uniqueId}-wrapper`;
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', this.options.modal ? 'true' : 'false');
    this.container.setAttribute('aria-labelledby', `${this.uniqueId}-title`);

    if (this.options.modal) {
      this.container.setAttribute('data-cka-modal', 'true');
    }

    // Create overlay (like PrimeNG's mask)
    this.overlay = document.createElement('div');
    this.overlay.className = 'cka-dialog-overlay';

    // Calculate z-index
    if (this.options.autoZIndex) {
      this.zIndex = this.options.baseZIndex + this.positionManager.getNextZIndex();
    } else {
      this.zIndex = this.options.baseZIndex || 1000;
    }

    // Set overlay styles
    this.overlay.style.zIndex = (this.zIndex - 1).toString();

    // Create dialog content with PrimeNG-like structure
    const dialogClasses = ['cka-dialog'];
    if (this.options.styleClass) {
      dialogClasses.push(...this.options.styleClass.split(' '));
    }

    const headerDisplay = this.options.showHeader ? 'flex' : 'none';

    const content = `
      <div class="${dialogClasses.join(' ')}" style="width: ${this.options.width}; height: ${this.options.height}; z-index: ${this.zIndex};">
        <header class="cka-dialog-header ${this.options.draggable ? 'draggable' : ''} ${this.options.headerClass}" style="display: ${headerDisplay}">
          <span class="cka-dialog-title" id="${this.uniqueId}-title"></span>
          <div class="cka-dialog-header-icons">
            ${this.options.maximizable ? '<button type="button" class="cka-dialog-maximize" aria-label="Maximize"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 4h16v16H4V4zm2 4h12v10H6V8z"></path></svg></button>' : ''}
            ${this.options.defaultCloseButton ? '<button type="button" class="cka-dialog-close" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg></button>' : ''}
          </div>
        </header>
        <main class="cka-dialog-content ${this.options.contentClass}"></main>
        <footer class="cka-dialog-footer ${this.options.footerClass}"></footer>
        ${this.options.resizable ? '<div class="cka-resizer"></div>' : ''}
      </div>
    `;

    // Add content to container
    this.container.innerHTML = content;

    // Get references to dialog elements
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

    // Set element for backward compatibility
    this.element = this.dialog;

    // Apply custom styles
    if (this.options.style) {
      Object.assign(this.dialog.style, this.options.style);
    }

    // Setup initial buttons if provided
    this.setupButtons(this.options.buttons);

    // Setup focus tracking for dialog
    this.focusTracker.add(this.dialog);

    // Setup keystrokes for dialog
    this.keystrokes.listenTo(this.dialog);
  }

  // Hide without animation (for initial setup)
  private _hideWithoutAnimation(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    this.visible = false;
  }

  // Add elements to DOM
  private _addToDOMIfNeeded(): void {
    if (this.isAddedToDOM) return;

    // Add overlay to container if modal
    if (this.options.modal && !document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }

    // Append to specified element
    if (!document.body.contains(this.container)) {
      if (this.options.appendTo === 'body' || !this.options.appendTo) {
        document.body.appendChild(this.container);
      } else if (typeof this.options.appendTo === 'string') {
        const appendTarget = document.querySelector(this.options.appendTo);
        if (appendTarget) {
          appendTarget.appendChild(this.container);
        } else {
          document.body.appendChild(this.container);
        }
      } else if (this.options.appendTo instanceof HTMLElement) {
        this.options.appendTo.appendChild(this.container);
      }
    }

    this.isAddedToDOM = true;
  }

  private setupButtons(buttons?: DialogButton[]): void {
    if (!buttons || buttons.length === 0) {
      return;
    }

    // Clear existing buttons
    if (this.footer) {
      this.footer.innerHTML = '';
      this.primaryButton = null;

      const footerButtons = document.createElement('div');
      footerButtons.className = 'cka-dialog-footer-buttons';

      // Create and append each button with PrimeNG-like styling
      buttons.forEach(buttonConfig => {
        // Set default styles based on button type
        const defaultedConfig = { ...buttonConfig };

        if (defaultedConfig.label.toLowerCase() === 'continue' ||
          defaultedConfig.label.toLowerCase() === 'submit' ||
          defaultedConfig.label.toLowerCase() === 'ok' ||
          defaultedConfig.isPrimary) {
          defaultedConfig.variant = defaultedConfig.variant || 'default';
          defaultedConfig.shape = defaultedConfig.shape || 'round';
        } else if (defaultedConfig.label.toLowerCase() === 'cancel') {
          defaultedConfig.variant = defaultedConfig.variant || 'outlined';
          defaultedConfig.shape = defaultedConfig.shape || 'round';
        }

        const button = this.createButton(defaultedConfig);

        if (buttonConfig.disabled) {
          button.disabled = true;
        }

        footerButtons.appendChild(button);
      });

      this.footer.appendChild(footerButtons);
    }
  }

  // Update the createButton method for PrimeNG-like buttons
  private createButton(config: DialogButton): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button'; // Explicit type for accessibility

    let className = 'cka-button';

    // Add custom className if provided
    if (config.className) {
      className += ` ${config.className}`;
    }

    // Add variant class
    if (config.variant) {
      className += ` cka-button-${config.variant}`;
    }

    // Add primary class
    if (config.isPrimary) {
      className += ' cka-button-primary';
      this.primaryButton = button;
    }

    // Add shape class
    if (config.shape === 'round') {
      className += ' cka-button-rounded';
    }

    // Add loading class
    if (config.loading) {
      className += ' cka-button-loading';
    }

    button.className = className;

    // Create button content with icon support (PrimeNG behavior)
    if (config.icon) {
      const iconEl = document.createElement('span');
      iconEl.className = `cka-button-icon ${config.icon}`;

      if (config.iconPos === 'right') {
        button.appendChild(document.createTextNode(config.label));
        button.appendChild(iconEl);
        button.classList.add('cka-button-icon-right');
      } else {
        button.appendChild(iconEl);
        button.appendChild(document.createTextNode(config.label));
        button.classList.add('cka-button-icon-left');
      }
    } else {
      button.textContent = config.label;
    }

    // Add loading indicator if needed
    if (config.loading) {
      const spinner = document.createElement('span');
      spinner.className = 'cka-button-spinner';
      spinner.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4"></circle></svg>';
      button.appendChild(spinner);
    }

    // Add click handler
    button.onclick = (e) => {
      // Call custom click handler if provided
      if (config.onClick) {
        config.onClick(e);
      }

      // Emit event
      this.emit('buttonClick', { originalEvent: e, button: config.label });

      // Close dialog if specified
      if (config.closeOnClick !== false) {
        this.hide();
      }
    };

    return button;
  }

  private setupEventListeners(): void {
    if (!this.container) return;

    // Close button
    const closeBtn = this.container.querySelector('.cka-dialog-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default (PrimeNG behavior)
        this.hide();
        this.emit('close', { originalEvent: e, type: 'close' });
      });
    }

    // Maximize button
    if (this.options.maximizable) {
      const maxBtn = this.container.querySelector('.cka-dialog-maximize');
      if (maxBtn) {
        maxBtn.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default (PrimeNG behavior)
          this.toggleMaximize();
          this.emit('maximize', { originalEvent: e, maximized: this.maximized });
        });
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
    if (this.options.modal &&
      (this.options.dismissableMask || this.options.closeOnClickOutside)) {
      document.addEventListener('mousedown', this.boundHandleClickOutside);
    }

    // Enter key submission
    if (this.options.submitOnEnter) {
      document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    // Window resize
    window.addEventListener('resize', this.boundHandleWindowResize);

    // Setup keystroke handling
    if (this.dialog) {
      this.keystrokes.listenTo(this.dialog);
    }
  }

  private setupDragging(): void {
    if (!this.options.draggable || !this.header) return;

    this.header.classList.add('draggable');

    const handleMouseDown = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;

      // Don't initiate drag when clicking on buttons
      if (e.target instanceof Element) {
        const isClickOnButton = e.target.closest('.cka-dialog-header-icons') !== null;
        if (isClickOnButton) return;
      }

      if (this.maximized) return; // Don't allow dragging when maximized (PrimeNG behavior)

      this.isDragging = true;
      const rect = this.dialog.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Add grabbing class for cursor style
      this.header.classList.add('grabbing');

      // Remove the centering transform when starting to drag
      this.dialog.style.transform = 'none';

      // Store initial position
      this.initialPosition = {
        x: rect.left,
        y: rect.top
      };

      // Set position explicitly
      this.dialog.style.left = `${this.initialPosition.x}px`;
      this.dialog.style.top = `${this.initialPosition.y}px`;

      // Prevent text selection during drag
      e.preventDefault();
    };

    const handleMouseMove = (e: Event) => {
      if (!(e instanceof MouseEvent) || !this.isDragging) return;

      e.preventDefault();

      // Calculate new position with boundary constraints
      const newLeft = Math.max(0, e.clientX - this.dragOffset.x);
      const newTop = Math.max(0, e.clientY - this.dragOffset.y);

      // Ensure dialog stays in viewport (right and bottom edges)
      const maxLeft = window.innerWidth - this.dialog.offsetWidth;
      const maxTop = window.innerHeight - this.dialog.offsetHeight;

      // Apply new position
      this.dialog.style.left = `${Math.min(newLeft, maxLeft)}px`;
      this.dialog.style.top = `${Math.min(newTop, maxTop)}px`;

      // Add dragging class to dialog for styling
      this.dialog.classList.add('cka-dragging');
    };

    const handleMouseUp = () => {
      this.isDragging = false;

      // Remove grabbing and dragging classes
      this.header.classList.remove('grabbing');
      this.dialog.classList.remove('cka-dragging');

      // Emit dragEnd event (PrimeNG behavior)
      this.emit('dragEnd', {
        left: parseInt(this.dialog.style.left),
        top: parseInt(this.dialog.style.top)
      });
    };

    this.header.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  private setupResizing(): void {
    if (!this.options.resizable || !this.container) return;

    const resizer = this.container.querySelector('.cka-resizer');
    if (!resizer) return;

    const handleMouseDown = (e: Event) => {
      if (!(e instanceof MouseEvent)) return;
      if (this.maximized) return; // Don't allow resizing when maximized (PrimeNG behavior)

      this.isResizing = true;

      // Store initial values
      this.resizeStart = {
        mousePos: { x: e.clientX, y: e.clientY },
        size: {
          width: this.dialog.offsetWidth,
          height: this.dialog.offsetHeight
        }
      };

      // Add resizing class
      this.dialog.classList.add('cka-resizing');

      // Prevent text selection during resize
      e.preventDefault();
    };

    const handleMouseMove = (e: Event) => {
      if (!(e instanceof MouseEvent) || !this.isResizing) return;

      e.preventDefault();

      // Calculate size delta
      const deltaX = e.clientX - this.resizeStart.mousePos.x;
      const deltaY = e.clientY - this.resizeStart.mousePos.y;

      // Calculate new size with minimum constraints (PrimeNG-like)
      const newWidth = Math.max(this.resizeStart.size.width + deltaX, 300); // Minimum width
      const newHeight = Math.max(this.resizeStart.size.height + deltaY, 200); // Minimum height

      // Apply new size
      this.dialog.style.width = `${newWidth}px`;
      this.dialog.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      this.isResizing = false;

      // Remove resizing class
      this.dialog.classList.remove('cka-resizing');

      // Emit resizeEnd event (PrimeNG behavior)
      this.emit('resizeEnd', {
        width: parseInt(this.dialog.style.width),
        height: parseInt(this.dialog.style.height)
      });
    };

    resizer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  public show(): void {
    if (this.isDestroyed) return;
    if (this.visible) return;

    // Store previously focused element to restore focus when closing (accessibility)
    this.previousActiveElement = document.activeElement;

    // Emit beforeShow event
    const beforeShowEvent = this.emit('beforeShow');

    // Check if event was cancelled
    if (beforeShowEvent === false) return;

    // Add DOM elements if needed
    this._addToDOMIfNeeded();

    this.visible = true;

    // Show overlay and container
    if (this.options.modal && this.overlay) {
      this.overlay.style.display = 'block';
      // Animate overlay
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.style.opacity = '0.4';
          this.overlay.style.transition = 'opacity 150ms';
        }
      }, 0);
    }

    if (this.container) {
      this.container.style.display = 'block';
    }

    // Position dialog with centering as a priority
    if (this.options.position === 'center') {
      this.centerDialog();
    } else {
      this.positionDialog();
    }

    // Set initial animation state
    if (this.dialog) {
      // For center position, maintain the translate transform while changing scale
      const transform = this.options.position === 'center'
        ? 'translate(-50%, -50%) scale(0.7)'
        : 'scale(0.7)';

      this.dialog.style.opacity = '0';
      this.dialog.style.transform = transform;

      // Set transition for animation
      this.dialog.style.transition = this.options.transitionOptions;

      // Trigger animation
      setTimeout(() => {
        if (this.dialog) {
          // Maintain centering transform when scaling to 1
          const finalTransform = this.options.position === 'center'
            ? 'translate(-50%, -50%) scale(1)'
            : 'scale(1)';

          this.dialog.style.opacity = '1';
          this.dialog.style.transform = finalTransform;  // CHANGED: Use the finalTransform variable
        }

        // Focus the dialog or primary button (accessibility)
        setTimeout(() => {
          // Try to focus the primary button if it exists
          if (this.primaryButton) {
            this.primaryButton.focus();
          } else if (this.dialog) {
            // Otherwise focus the dialog itself
            this.dialog.focus();
          }

          // Emit show event after animation completes
          this.emit('show');

          // Call onOpen callback for backward compatibility
          if (this.options.onOpen) {
            this.options.onOpen();
          }
        }, 150);
      }, 0);
    }

    // Restore maximized state if needed
    if (this.maximized) {
      this.toggleMaximize(true);
    }

    // Check responsive breakpoints
    this.checkBreakpoints();
  }

  public hide(): void {
    if (!this.visible) return;

    // Emit beforeHide event (PrimeNG behavior)
    const beforeHideEvent = this.emit('beforeHide');

    // Check if event was cancelled
    if (beforeHideEvent === false) return;

    // Start hide animation
    if (this.dialog) {
      this.dialog.style.opacity = '0';
      this.dialog.style.transform = 'scale(0.7)';
    }

    if (this.overlay) {
      this.overlay.style.opacity = '0';
    }

    // Complete hiding after animation
    setTimeout(() => {
      this.visible = false;

      if (this.container) {
        this.container.style.display = 'none';
      }

      if (this.overlay) {
        this.overlay.style.display = 'none';
      }

      // Emit hide event
      this.emit('hide');

      // Call onClose callback for backward compatibility
      if (this.options.onClose) {
        this.options.onClose();
      }

      // Restore focus to previous element (accessibility)
      if (this.previousActiveElement instanceof HTMLElement) {
        this.previousActiveElement.focus();
        this.previousActiveElement = null;
      }
    }, 150);
  }

  public destroy(): void {
    if (this.isDestroyed) return;

    // Hide first if visible
    if (this.visible) {
      this.hide();
    }

    // Remove event listeners
    document.removeEventListener('keydown', this.boundHandleEscape);
    document.removeEventListener('mousedown', this.boundHandleClickOutside);
    document.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('resize', this.boundHandleWindowResize);

    // Cleanup objects
    this.focusTracker.destroy();
    this.keystrokes.destroy();

    // Remove elements after animation completes
    setTimeout(() => {
      // Remove overlay
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }

      // Remove container
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }

      // Clear references
      this.overlay = null!;
      this.container = null!;
      this.dialog = null!;
      this.header = null!;
      this.contentEl = null!;
      this.footer = null!;
      this.element = null;

      this.isDestroyed = true;
    }, this.visible ? 150 : 0);
  }

  public setContent(content: string | Node): void {
    if (this.isDestroyed || !this.contentEl) return;

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
    if (this.isDestroyed) return;

    const titleEl = this.container.querySelector('.cka-dialog-title');
    if (titleEl) {
      titleEl.textContent = title;
    }

    // Update option
    this.options.title = title;
  }

  public setFooter(content: string | Node): void {
    if (this.isDestroyed || !this.footer) return;

    if (typeof content === 'string') {
      this.footer.innerHTML = content;
    } else if (content instanceof Node) {
      this.footer.innerHTML = '';
      this.footer.appendChild(content);
    }
  }

  // Set size of dialog (PrimeNG-like API)
  public setSize(width?: string | number, height?: string | number): void {
    if (this.isDestroyed || !this.dialog || this.maximized) return;

    if (width !== undefined) {
      this.dialog.style.width = typeof width === 'number' ? `${width}px` : width;
      this.options.width = typeof width === 'number' ? `${width}px` : width;
    }

    if (height !== undefined) {
      this.dialog.style.height = typeof height === 'number' ? `${height}px` : height;
      this.options.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Recenter if centered position
    if (this.options.position === 'center') {
      this.centerDialog();
    }
  }

  public toggleMaximize(forceState?: boolean): void {
    // Set new state (or toggle if not specified)
    const newMaximizedState = forceState !== undefined ? forceState : !this.maximized;

    if (this.maximized === newMaximizedState) return;
    this.maximized = newMaximizedState;

    if (!this.dialog) return;

    if (this.maximized) {
      // Store current position and size for restoration
      this.initialSize = {
        width: this.dialog.offsetWidth,
        height: this.dialog.offsetHeight
      };

      this.originalStyles = {
        width: this.dialog.style.width,
        height: this.dialog.style.height,
        left: this.dialog.style.left,
        top: this.dialog.style.top
      };

      // Apply maximized styles with animation
      this.dialog.style.transition = 'all 150ms';
      this.dialog.style.left = '0';
      this.dialog.style.top = '0';
      this.dialog.style.width = '100vw';
      this.dialog.style.height = '100vh';
      this.dialog.style.borderRadius = '0';
      this.dialog.style.transform = 'none';

      // Add maximized class
      this.dialog.classList.add('cka-dialog-maximized');

      // Update maximize button icon
      const maxBtn = this.container.querySelector('.cka-dialog-maximize svg path');
      if (maxBtn) {
        (maxBtn as SVGPathElement).setAttribute('d', 'M4 8h16V4H4v4zm0 6h16v-2H4v2zm0 6h16v-4H4v4z');
      }
    } else {
      // Restore original size and position with animation
      this.dialog.style.transition = 'all 150ms';

      if (this.originalStyles.width) {
        this.dialog.style.width = this.originalStyles.width;
      }
      if (this.originalStyles.height) {
        this.dialog.style.height = this.originalStyles.height;
      }

      // Handle position restore - if was centered, recenter
      if (this.options.position === 'center') {
        this.centerDialog();
      } else {
        // Otherwise restore exact position
        if (this.originalStyles.left) {
          this.dialog.style.left = this.originalStyles.left;
        }
        if (this.originalStyles.top) {
          this.dialog.style.top = this.originalStyles.top;
        }
      }

      this.dialog.style.borderRadius = '';

      // Remove maximized class
      this.dialog.classList.remove('cka-dialog-maximized');

      // Update maximize button icon
      const maxBtn = this.container.querySelector('.cka-dialog-maximize svg path');
      if (maxBtn) {
        (maxBtn as SVGPathElement).setAttribute('d', 'M4 4h16v16H4V4zm2 4h12v10H6V8z');
      }
    }

    // Emit maximize event
    this.emit('maximize', { maximized: this.maximized });
  }

  // Position dialog based on position option (PrimeNG behavior)
  private positionDialog(): void {
    if (!this.dialog || this.maximized) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reset transform and position for proper measurements
    this.dialog.style.transform = 'none';

    // Get dialog dimensions (wait for it to be in the DOM if needed)
    setTimeout(() => {
      const dialogWidth = this.dialog.offsetWidth;
      const dialogHeight = this.dialog.offsetHeight;

      let top: string;
      let left: string;
      let transform: string = 'none';

      // Calculate position based on specified position option
      switch (this.options.position) {
        case 'top':
          top = '0';
          left = '50%';
          transform = 'translateX(-50%)';
          break;
        case 'bottom':
          top = `${viewportHeight - dialogHeight}px`;
          left = '50%';
          transform = 'translateX(-50%)';
          break;
        case 'left':
          top = '50%';
          left = '0';
          transform = 'translateY(-50%)';
          break;
        case 'right':
          top = '50%';
          left = `${viewportWidth - dialogWidth}px`;
          transform = 'translateY(-50%)';
          break;
        case 'top-left':
          top = '0';
          left = '0';
          break;
        case 'top-right':
          top = '0';
          left = `${viewportWidth - dialogWidth}px`;
          break;
        case 'bottom-left':
          top = `${viewportHeight - dialogHeight}px`;
          left = '0';
          break;
        case 'bottom-right':
          top = `${viewportHeight - dialogHeight}px`;
          left = `${viewportWidth - dialogWidth}px`;
          break;
        case 'center':
        default:
          top = '50%';
          left = '50%';
          transform = 'translate(-50%, -50%)';
          break;
      }

      // Apply position
      this.dialog.style.top = top;
      this.dialog.style.left = left;
      this.dialog.style.transform = transform;
    }, 0);
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isMaximized(): boolean {
    return this.maximized;
  }

  // Focus the dialog or a specific element inside it
  public focus(selector?: string): void {
    if (this.isDestroyed || !this.dialog) return;

    if (selector) {
      const element = this.dialog.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    } else if (this.primaryButton) {
      this.primaryButton.focus();
    } else {
      this.dialog.focus();
    }
  }

  // Event handling methods (PrimeNG-like event system)
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      this.eventListeners.set(
        event,
        callbacks.filter(fn => fn !== callback)
      );
    }
  }

  private emit(event: string, data?: any): boolean | void {
    let canceled = false;

    this.eventListeners.get(event)?.forEach(callback => {
      const result = callback(data);
      if (result === false) {
        canceled = true;
      }
    });

    if (canceled) {
      return false;
    }
  }

  // Getter for the dialog element (PrimeNG-like API)
  public getElement(): HTMLElement | null {
    return this.dialog || null;
  }

  // Getter for the content element
  public getContentElement(): HTMLElement | null {
    return this.contentEl || null;
  }
}

export default CkAlightModalDialog;