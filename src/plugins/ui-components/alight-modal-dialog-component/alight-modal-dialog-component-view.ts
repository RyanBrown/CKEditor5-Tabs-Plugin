// src/plugins/ui-components/alight-modal-dialog-component/alight-modal-dialog-component-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

interface ModalViewProperties {
  title: string;
  isDraggable: boolean;
  isResizable: boolean;
  isVisible: boolean; // Added for PrimeNG-like behavior
  isModal: boolean;
  maximized: boolean; // Added for PrimeNG-like behavior
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export class ModalView extends AlightUIBaseComponent implements ModalViewProperties {
  declare public title: string;
  declare public isDraggable: boolean;
  declare public isResizable: boolean;
  declare public isVisible: boolean;
  declare public isModal: boolean;
  declare public maximized: boolean;
  declare public position: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;

  // Added for tracking drag state
  private isDragging: boolean = false;
  private dragOffset: { x: number, y: number } = { x: 0, y: 0 };

  // Added for tracking resize state
  private isResizing: boolean = false;
  private resizeStartSize: { width: number, height: number } = { width: 0, height: 0 };
  private resizeStartPosition: { x: number, y: number } = { x: 0, y: 0 };

  // Added for position tracking
  private originalPosition: { top: string | null, left: string | null } = { top: null, left: null };
  private originalSize: { width: string | null, height: string | null } = { width: null, height: null };

  // Add animation related properties
  private transitionDuration: number = 150; // ms

  // Track modal mask element for PrimeNG-like behavior
  private modalMask: HTMLElement | null = null;

  // Add flag to track if already added to DOM
  private isAddedToDOM: boolean = false;

  // Add a class property to store the original body overflow
  private originalBodyOverflow: string = '';

  constructor(locale: Locale) {
    super(locale);

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    // Initialize observable properties with type assertions
    this.set('title' as const, '');
    this.set('isDraggable' as const, true);
    this.set('isResizable' as const, true);
    this.set('isVisible' as const, false);
    this.set('isModal' as const, true);
    this.set('maximized' as const, false);
    this.set('position' as const, 'center');

    const bind = this.bindTemplate;

    // Updated template with additional PrimeNG-like classes and attributes
    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-modal',
          bind.to('isDraggable', (value: boolean) => value ? 'ck-modal--draggable' : ''),
          bind.to('isResizable', (value: boolean) => value ? 'ck-modal--resizable' : ''),
          bind.to('isVisible', (value: boolean) => value ? 'ck-modal--visible' : ''),
          bind.to('maximized', (value: boolean) => value ? 'ck-modal--maximized' : '')
        ],
        tabindex: '-1',
        'aria-modal': bind.to('isModal', value => value ? 'true' : 'false'),
        'aria-labelledby': 'ck-modal-title',
        role: 'dialog'
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__header'
            ]
          },
          children: [
            {
              tag: 'h2',
              attributes: {
                class: [
                  'ck-modal__title'
                ],
                id: 'ck-modal-title'
              },
              children: [
                {
                  text: bind.to('title')
                }
              ]
            },
            // Added maximize button (PrimeNG behavior)
            {
              tag: 'button',
              attributes: {
                class: [
                  'ck',
                  'ck-button',
                  'ck-modal__maximize-btn'
                ],
                'aria-label': bind.to('maximized', value => value ? 'Restore' : 'Maximize')
              },
              children: [
                {
                  tag: 'svg',
                  attributes: {
                    class: ['ck', 'ck-icon'],
                    viewBox: '0 0 24 24'
                  },
                  children: [
                    // Icon path will change based on maximized state
                    {
                      tag: 'path',
                      attributes: {
                        d: bind.to('maximized',
                          value => value
                            ? 'M4 8h16V4H4v4zm0 6h16v-2H4v2zm0 6h16v-4H4v4z' // Restore icon
                            : 'M4 4h16v16H4V4zm2 4h12v10H6V8z' // Maximize icon
                        )
                      }
                    }
                  ]
                }
              ],
              on: {
                click: bind.to(() => {
                  this.toggleMaximize();
                })
              }
            },
            {
              tag: 'button',
              attributes: {
                class: [
                  'ck',
                  'ck-button',
                  'ck-modal__close-btn'
                ],
                'aria-label': 'Close'
              },
              children: [
                {
                  tag: 'svg',
                  attributes: {
                    class: ['ck', 'ck-icon'],
                    viewBox: '0 0 24 24'
                  },
                  children: [
                    {
                      tag: 'path',
                      attributes: {
                        d: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z'
                      }
                    }
                  ]
                }
              ],
              on: {
                click: bind.to(() => {
                  this.fire('close');
                  this.hide();
                })
              }
            }
          ]
        },
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__body'
            ]
          }
        },
        // Added footer section (PrimeNG behavior)
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__footer'
            ]
          }
        },
        // Added resizer handle (PrimeNG behavior)
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__resizer'
            ],
            style: {
              display: bind.to('isResizable', value => value ? 'block' : 'none')
            }
          }
        }
      ]
    };

    this.setTemplate(template);

    // Listen for visibility changes to handle modal mask
    this.on('change:isVisible', (_evt, _propertyName, newValue) => {
      this._handleVisibilityChange(newValue);
    });

    // Listen for maximized changes
    this.on('change:maximized', (_evt, _propertyName, newValue) => {
      this._handleMaximizedChange(newValue);
    });
  }

  // @inheritdoc
  override render(): void {
    super.render();

    if (this.element) {
      // Initially set display to none to prevent showing on page load
      this.element.style.display = 'none';

      // Setup focus tracking
      this.focusTracker.add(this.element);

      // Setup keystroke handling
      this.keystrokes.listenTo(this.element);

      // Add Escape key handling (PrimeNG behavior)
      this.keystrokes.set('Esc', (evt, cancel) => {
        this.fire('close');
        this.hide();
        cancel();
      });

      // Setup drag and resize if enabled
      if (this.isDraggable) {
        this._initializeDragging();
      }

      if (this.isResizable) {
        this._initializeResizing();
      }
    }
  }

  // Method to disable scrolling
  private _disableBodyScroll(): void {
    // Save current body overflow style
    this.originalBodyOverflow = document.body.style.overflow;

    // Disable scrolling
    document.body.style.overflow = 'hidden';
  }

  // Method to restore scrolling
  private _restoreBodyScroll(): void {
    // Restore original overflow style
    document.body.style.overflow = this.originalBodyOverflow;
  }

  // Show the modal with animation (PrimeNG behavior)
  public show(): void {
    if (this.isVisible) return;

    // Disable body scrolling when modal is shown
    this._disableBodyScroll();

    // Create modal mask if modal
    if (this.isModal) {
      this._createModalMask();
    }

    // Set visible
    this.set('isVisible', true);

    // Position the modal
    this._setInitialPosition();

    // Start animation
    if (this.element) {
      // Store original size/position before showing
      if (!this.maximized) {
        this.originalPosition = {
          top: this.element.style.top,
          left: this.element.style.left
        };
        this.originalSize = {
          width: this.element.style.width,
          height: this.element.style.height
        };
      }

      // Set animation
      this.element.style.opacity = '0';
      this.element.style.transform = 'scale(0.7)';
      this.element.style.transition = `opacity ${this.transitionDuration}ms, transform ${this.transitionDuration}ms`;

      // Start animation after DOM update
      setTimeout(() => {
        if (this.element) {
          this.element.style.opacity = '1';
          this.element.style.transform = 'scale(1)';
        }

        // Focus element after animation
        setTimeout(() => {
          this.focus();
          this.fire('show');
        }, this.transitionDuration);
      }, 0);
    }
  }

  // Hide the modal with animation (PrimeNG behavior)
  public hide(): void {
    if (!this.isVisible) return;

    // Start hiding animation
    if (this.element) {
      this.element.style.opacity = '0';
      this.element.style.transform = 'scale(0.7)';

      // Complete hiding after animation
      setTimeout(() => {
        this.set('isVisible', false);

        // Remove modal mask
        if (this.isModal && this.modalMask) {
          document.body.removeChild(this.modalMask);
          this.modalMask = null;
        }

        // Restore body scrolling when modal is hidden
        this._restoreBodyScroll();

        this.fire('hide');
      }, this.transitionDuration);
    } else {
      this.set('isVisible', false);

      // Restore body scrolling when modal is hidden
      this._restoreBodyScroll();

      this.fire('hide');
    }
  }

  // Toggles maximized state (PrimeNG behavior)
  public toggleMaximize(): void {
    this.set('maximized', !this.maximized);
  }

  // Focuses the modal element.
  focus(): void {
    if (this.element) {
      this.element.focus();

      // If modal has an input, focus it (PrimeNG behavior)
      const firstInput = this.element.querySelector('input, textarea, select, button:not(.ck-modal__close-btn):not(.ck-modal__maximize-btn)') as HTMLElement;
      if (firstInput) {
        firstInput.focus();
      }
    }
  }

  // Set content of the modal body
  public setContent(content: string | Node): void {
    const body = this.element?.querySelector('.ck-modal__body');
    if (body) {
      // Clear existing content
      body.innerHTML = '';

      // Add new content
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }
    }
  }

  // Set content of the modal footer
  public setFooter(content: string | Node): void {
    const footer = this.element?.querySelector('.ck-modal__footer');
    if (footer) {
      // Clear existing content
      footer.innerHTML = '';

      // Add new content
      if (typeof content === 'string') {
        footer.innerHTML = content;
      } else {
        footer.appendChild(content);
      }
    }
  }

  // Handle visibility change
  private _handleVisibilityChange(isVisible: boolean): void {
    if (!this.element) return;

    if (isVisible) {
      // Only add to DOM if not already present
      if (!this.isAddedToDOM) {
        document.body.appendChild(this.element);
        this.isAddedToDOM = true;
      }
      this.element.style.display = 'flex';
    } else {
      this.element.style.display = 'none';
    }
  }

  // Handle maximized state change
  private _handleMaximizedChange(maximized: boolean): void {
    if (this.element) {
      if (maximized) {
        // Store current position/size before maximizing
        if (!this.originalPosition.top) {
          this.originalPosition = {
            top: this.element.style.top,
            left: this.element.style.left
          };
        }
        if (!this.originalSize.width) {
          this.originalSize = {
            width: this.element.style.width,
            height: this.element.style.height
          };
        }

        // Set maximized styles with animation
        this.element.style.transition = `all ${this.transitionDuration}ms`;
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100vw';
        this.element.style.height = '100vh';
        this.element.style.borderRadius = '0';

        // Disable dragging when maximized
        this.set('isDraggable', false);
        this.set('isResizable', false);
      } else {
        // Restore original position/size with animation
        this.element.style.transition = `all ${this.transitionDuration}ms`;

        if (this.originalPosition.top) {
          this.element.style.top = this.originalPosition.top;
        }
        if (this.originalPosition.left) {
          this.element.style.left = this.originalPosition.left;
        }
        if (this.originalSize.width) {
          this.element.style.width = this.originalSize.width;
        }
        if (this.originalSize.height) {
          this.element.style.height = this.originalSize.height;
        }

        this.element.style.borderRadius = '';

        // Re-enable dragging and resizing
        this.set('isDraggable', true);
        this.set('isResizable', true);
      }
    }
  }

  // Create modal mask (overlay) like PrimeNG
  private _createModalMask(): void {
    if (this.modalMask) return;

    this.modalMask = document.createElement('div');
    this.modalMask.className = 'ck-modal-mask';
    this.modalMask.style.position = 'fixed';
    this.modalMask.style.top = '0';
    this.modalMask.style.left = '0';
    this.modalMask.style.width = '100%';
    this.modalMask.style.height = '100%';
    this.modalMask.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    this.modalMask.style.zIndex = (parseInt(this.element?.style.zIndex || '0') - 1).toString();
    this.modalMask.style.opacity = '0';
    this.modalMask.style.transition = `opacity ${this.transitionDuration}ms`;

    document.body.appendChild(this.modalMask);

    // Animate in
    setTimeout(() => {
      if (this.modalMask) {
        this.modalMask.style.opacity = '1';
      }
    }, 0);

    // Add click handler to close modal when clicking mask (PrimeNG behavior)
    this.modalMask.addEventListener('click', () => {
      this.fire('close');
      this.hide();
    });
  }

  // Set initial position based on position property (PrimeNG behavior)
  private _setInitialPosition(): void {
    if (!this.element) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = this.element.offsetWidth || 400; // Fallback width
    const modalHeight = this.element.offsetHeight || 300; // Fallback height

    let top = '50%';
    let left = '50%';
    let transform = 'translate(-50%, -50%)';

    // Calculate position based on specified alignment
    switch (this.position) {
      case 'top':
        top = '20px';
        left = '50%';
        transform = 'translateX(-50%)';
        break;
      case 'bottom':
        top = `${viewportHeight - modalHeight - 20}px`;
        left = '50%';
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = '50%';
        left = '20px';
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = '50%';
        left = `${viewportWidth - modalWidth - 20}px`;
        transform = 'translateY(-50%)';
        break;
      case 'top-left':
        top = '20px';
        left = '20px';
        transform = 'none';
        break;
      case 'top-right':
        top = '20px';
        left = `${viewportWidth - modalWidth - 20}px`;
        transform = 'none';
        break;
      case 'bottom-left':
        top = `${viewportHeight - modalHeight - 20}px`;
        left = '20px';
        transform = 'none';
        break;
      case 'bottom-right':
        top = `${viewportHeight - modalHeight - 20}px`;
        left = `${viewportWidth - modalWidth - 20}px`;
        transform = 'none';
        break;
      case 'center':
      default:
        top = '50%';
        left = '50%';
        transform = 'translate(-50%, -50%)';
        break;
    }

    // Apply position
    this.element.style.top = top;
    this.element.style.left = left;
    this.element.style.transform = transform;
  }

  // Initializes dragging functionality with improved PrimeNG-like behavior
  private _initializeDragging(): void {
    if (!this.element) return;

    const header = this.element.querySelector('.ck-modal__header') as HTMLElement;
    if (!header) return;

    header.style.cursor = 'move';

    const handleMouseDown = (e: MouseEvent) => {
      // Don't allow dragging when maximized or when clicking buttons
      if (this.maximized ||
        (e.target instanceof HTMLElement && (
          e.target.closest('.ck-modal__close-btn') ||
          e.target.closest('.ck-modal__maximize-btn')
        ))) {
        return;
      }

      e.preventDefault();
      this.isDragging = true;

      // Calculate offset from mouse position to dialog corner
      const rect = this.element!.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Add dragging class
      this.element!.classList.add('ck-modal--dragging');

      // Remove transform to avoid conflicts during drag
      this.element!.style.transform = 'none';

      // Capture mouse
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;

      e.preventDefault();

      // Calculate new position
      const newLeft = e.clientX - this.dragOffset.x;
      const newTop = e.clientY - this.dragOffset.y;

      // Apply new position with bounds checking (keep in viewport)
      if (this.element) {
        const modalWidth = this.element.offsetWidth;
        const modalHeight = this.element.offsetHeight;

        // Constrain to viewport
        const maxLeft = window.innerWidth - modalWidth;
        const maxTop = window.innerHeight - modalHeight;

        this.element.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
        this.element.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
      }
    };

    const handleMouseUp = () => {
      this.isDragging = false;

      if (this.element) {
        // Remove dragging class
        this.element.classList.remove('ck-modal--dragging');

        // Update original position for maximize/restore
        this.originalPosition = {
          top: this.element.style.top,
          left: this.element.style.left
        };
      }

      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Add mousedown listener to header
    header.addEventListener('mousedown', handleMouseDown);
  }

  // Initializes resizing functionality with improved PrimeNG-like behavior
  private _initializeResizing(): void {
    if (!this.element) return;

    const resizer = this.element.querySelector('.ck-modal__resizer') as HTMLElement;
    if (!resizer) return;

    // Style the resizer
    resizer.style.position = 'absolute';
    resizer.style.bottom = '0';
    resizer.style.right = '0';
    resizer.style.width = '20px';
    resizer.style.height = '20px';
    resizer.style.cursor = 'se-resize';

    const handleMouseDown = (e: MouseEvent) => {
      // Don't allow resizing when maximized
      if (this.maximized) return;

      e.preventDefault();
      this.isResizing = true;

      // Store initial values
      this.resizeStartPosition = { x: e.clientX, y: e.clientY };

      if (this.element) {
        this.resizeStartSize = {
          width: this.element.offsetWidth,
          height: this.element.offsetHeight
        };

        // Add resizing class
        this.element.classList.add('ck-modal--resizing');
      }

      // Capture mouse
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!this.isResizing || !this.element) return;

      e.preventDefault();

      // Calculate size difference
      const deltaX = e.clientX - this.resizeStartPosition.x;
      const deltaY = e.clientY - this.resizeStartPosition.y;

      // Calculate new size with minimum constraints
      const newWidth = Math.max(200, this.resizeStartSize.width + deltaX);
      const newHeight = Math.max(150, this.resizeStartSize.height + deltaY);

      // Apply new size
      this.element.style.width = `${newWidth}px`;
      this.element.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      this.isResizing = false;

      if (this.element) {
        // Remove resizing class
        this.element.classList.remove('ck-modal--resizing');

        // Update original size for maximize/restore
        this.originalSize = {
          width: this.element.style.width,
          height: this.element.style.height
        };
      }

      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    // Add mousedown listener to resizer
    resizer.addEventListener('mousedown', handleMouseDown);
  }

  // PrimeNG-like cleanup
  override destroy(): void {
    // Restore body scrolling when modal is destroyed
    if (this.isVisible) {
      this._restoreBodyScroll();
    }

    // Remove modal mask
    if (this.modalMask && document.body.contains(this.modalMask)) {
      document.body.removeChild(this.modalMask);
    }

    // Remove element from body if it was appended
    if (this.element && document.body.contains(this.element)) {
      document.body.removeChild(this.element);
    }

    // Clean up keystroke handler and focus tracker
    this.keystrokes.destroy();
    this.focusTracker.destroy();

    super.destroy();
  }
}
