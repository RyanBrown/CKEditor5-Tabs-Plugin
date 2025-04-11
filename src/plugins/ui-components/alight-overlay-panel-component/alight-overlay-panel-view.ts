// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import { global } from '@ckeditor/ckeditor5-utils';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';
import { AlightPositionManager } from '../alight-ui-component-utils/alight-position-manager';

export type PanelPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'auto';

export interface OverlayPanelPosition {
  targetElement: HTMLElement;
  position?: PanelPosition;
  offset?: { x: number; y: number };
  my?: string; // PrimeNG-like positioning (e.g., "left top")
  at?: string; // PrimeNG-like positioning (e.g., "left bottom")
  appendTo?: 'body' | HTMLElement; // PrimeNG appendTo option
}

interface OverlayPanelProperties {
  isVisible: boolean;
  position: PanelPosition;
  dismissable: boolean; // PrimeNG-like property
  showHeader: boolean; // PrimeNG-like property
  baseZIndex: number; // PrimeNG-like property
  autoZIndex: boolean; // PrimeNG-like property
  showCloseIcon: boolean; // PrimeNG-like property
  styleClass: string; // PrimeNG-like property
}

interface PropertyChangeEvent extends BaseEvent {
  name: 'change:isVisible' | 'change:position' | 'change:dismissable' |
  'change:showHeader' | 'change:baseZIndex' | 'change:autoZIndex' |
  'change:showCloseIcon' | 'change:styleClass';
  args: [evt: BaseEvent, propertyName: string, value: any];
  return: void;
}

export class OverlayPanelView extends AlightUIBaseComponent implements OverlayPanelProperties {
  declare public isVisible: boolean;
  declare public position: PanelPosition;
  declare public dismissable: boolean;
  declare public showHeader: boolean;
  declare public baseZIndex: number;
  declare public autoZIndex: boolean;
  declare public showCloseIcon: boolean;
  declare public styleClass: string;

  public readonly contentView: View;
  public readonly headerView: View; // Added for PrimeNG-like header
  private readonly id: string;
  private positionManager: AlightPositionManager;

  private _targetElement: HTMLElement | null = null;
  private _positionOffset: { x: number; y: number } = { x: 0, y: 0 };
  private readonly _clickOutsideHandler: (event: MouseEvent) => void;
  private readonly _windowResizeHandler: () => void;
  private readonly _escapeKeyHandler: (event: KeyboardEvent) => void;
  private _originalParent: HTMLElement | null = null;
  private _animating: boolean = false;
  private transitionDuration: number = 150;

  constructor(locale: Locale) {
    super(locale);

    const bind = this.bindTemplate;
    this.positionManager = AlightPositionManager.getInstance();
    this.id = 'overlay-panel-' + Math.random().toString(36).substr(2, 9);

    // Initialize observable properties (Fix: Removed 'as const' from property names)
    this.set('isVisible', false);
    this.set('position', 'auto');
    this.set('dismissable', true);
    this.set('showHeader', false);
    this.set('baseZIndex', 0);
    this.set('autoZIndex', true);
    this.set('showCloseIcon', false);
    this.set('styleClass', '');

    // Create header view (for PrimeNG-like header)
    this.headerView = new View(locale);
    this.headerView.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'cka-overlay-panel__header'
        ]
      },
      children: [
        {
          tag: 'span',
          attributes: {
            class: [
              'cka-overlay-panel__title'
            ]
          }
        },
        {
          tag: 'button',
          attributes: {
            class: [
              'cka-overlay-panel__close-icon'
            ],
            'aria-label': 'Close',
            type: 'button'
          },
          children: [
            {
              tag: 'svg',
              attributes: {
                width: '14',
                height: '14',
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
              this.hide();
            })
          }
        }
      ]
    });

    // Create content view container
    this.contentView = new View(locale);
    this.contentView.setTemplate({
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'cka-overlay-panel__content'
        ]
      }
    });

    // Bind handlers
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
    this._windowResizeHandler = this._handleWindowResize.bind(this);
    this._escapeKeyHandler = this._handleEscapeKey.bind(this);

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'cka-overlay-panel',
          bind.to('isVisible', (value: boolean) => value ? 'cka-overlay-panel--visible' : ''),
          bind.to('position', (value: PanelPosition) => `cka-overlay-panel--${value}`),
          bind.to('styleClass')
        ],
        tabindex: '-1',
        id: this.id
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: 'cka-overlay-panel__wrapper'
          },
          children: [
            {
              // Only show header if showHeader is true
              tag: 'div',
              attributes: {
                class: 'cka-overlay-panel__header-container',
                style: {
                  display: bind.to('showHeader', (value) => value ? 'block' : 'none')
                }
              },
              children: [this.headerView]
            },
            this.contentView
          ]
        }
      ]
    };

    this.setTemplate(template);

    // Listen for isVisible changes to manage event listeners and animation
    this.on<PropertyChangeEvent>('change:isVisible', (_evt, _propertyName, value) => {
      if (value) {
        this._addListeners();
        this._animateIn();
      } else {
        this._animateOut();
      }
    });

    // Listen for other property changes
    this.on<PropertyChangeEvent>('change:showCloseIcon', (_evt, _propertyName, value: any) => {
      this._updateCloseIcon(value);
    });
  }

  // @inheritdoc
  override render(): void {
    super.render();

    // Initial setup if already visible
    if (this.isVisible && this._targetElement) {
      this._updatePosition();
    }

    // Update close icon visibility
    this._updateCloseIcon(this.showCloseIcon);
  }

  // Set the title for the header
  public setTitle(title: string): void {
    if (!this.element) return;

    const titleEl = this.element.querySelector('.cka-overlay-panel__title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  // Shows the overlay panel with PrimeNG-like behavior
  show(config: OverlayPanelPosition): void {
    if (this._animating) return;

    // Fire before show event (PrimeNG behavior)
    const beforeShowEvent = {
      originalEvent: null as any, // Use any to satisfy TypeScript
      target: config.targetElement
    };
    this.fire('beforeShow', beforeShowEvent);

    this._targetElement = config.targetElement;
    this.set('position', config.position || 'auto');
    this._positionOffset = config.offset || { x: 0, y: 0 };

    // Store original parent for cleanup
    if (this.element && !this._originalParent) {
      this._originalParent = this.element.parentElement;
    }

    // Handle appendTo option (PrimeNG behavior)
    if (this.element) {
      if (config.appendTo === 'body') {
        document.body.appendChild(this.element);
      } else if (config.appendTo instanceof HTMLElement) {
        config.appendTo.appendChild(this.element);
      }
    }

    // Set z-index (like PrimeNG)
    if (this.element) {
      if (this.autoZIndex) {
        const zIndex = this.baseZIndex + this.positionManager.getNextZIndex();
        this.element.style.zIndex = zIndex.toString();
      } else if (this.baseZIndex) {
        this.element.style.zIndex = this.baseZIndex.toString();
      }
    }

    this.set('isVisible', true);

    // Position is updated in the animation in handler
  }

  // Hides the overlay panel with PrimeNG-like behavior
  hide(): void {
    if (!this.isVisible || this._animating) return;

    // Fire before hide event (PrimeNG behavior)
    const beforeHideEvent = {
      target: this._targetElement
    };
    this.fire('beforeHide', beforeHideEvent);

    this._animateOut();
  }

  // Toggles the overlay panel visibility (PrimeNG behavior)
  toggle(targetElement: HTMLElement, event?: Event): void {
    if (this.isVisible) {
      if (this._targetElement === targetElement) {
        this.hide();
      } else {
        this._targetElement = targetElement;
        this._updatePosition();
      }
    } else {
      this.show({ targetElement });
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // Updates the content of the panel.
  setContent(content: string | View): void {
    if (typeof content === 'string') {
      this.contentView.setTemplate({
        tag: 'div',
        attributes: {
          class: [
            'ck',
            'cka-overlay-panel__content'
          ]
        },
        children: [{ text: content }]
      });
    } else {
      this.contentView.setTemplate({
        tag: 'div',
        attributes: {
          class: [
            'ck',
            'cka-overlay-panel__content'
          ]
        },
        children: [content]
      });
    }

    // Re-render the content view if already rendered
    if (this.contentView.element) {
      this.contentView.render();
    }

    // Update position if visible
    if (this.isVisible && this.element) {
      this._updatePosition();
    }
  }

  // Animate in (PrimeNG-like behavior)
  private _animateIn(): void {
    if (!this.element) return;
    this._animating = true;

    // Set initial state for animation
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(0.7)';
    this.element.style.transition = `opacity ${this.transitionDuration}ms, transform ${this.transitionDuration}ms`;

    // Position element before animation
    this._updatePosition();

    // Start animation
    setTimeout(() => {
      if (this.element) {
        this.element.style.opacity = '1';
        this.element.style.transform = 'scale(1)';

        // Complete animation
        setTimeout(() => {
          this._animating = false;

          // Focus panel (PrimeNG behavior)
          this.element?.focus();

          // Fire show event (PrimeNG behavior)
          this.fire('show', {
            target: this._targetElement
          });
        }, this.transitionDuration);
      }
    }, 0);
  }

  // Animate out (PrimeNG behavior)
  private _animateOut(): void {
    if (!this.element) {
      this.set('isVisible', false);
      return;
    }

    this._animating = true;

    // Set animation
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(0.7)';

    // Remove after animation completes
    setTimeout(() => {
      this._animating = false;
      this.set('isVisible', false);
      this._removeListeners();

      // Fire hide event (PrimeNG behavior)
      this.fire('hide', {
        target: this._targetElement
      });

      // Return to original parent if moved
      if (this._originalParent && this.element && this.element.parentElement !== this._originalParent) {
        try {
          this._originalParent.appendChild(this.element);
        } catch (e) {
          // Ignore errors if element was already removed
        }
      }
    }, this.transitionDuration);
  }

  // Update close icon visibility
  private _updateCloseIcon(visible: boolean): void {
    if (!this.element) return;

    const closeIcon = this.element.querySelector('.cka-overlay-panel__close-icon');
    if (closeIcon) {
      (closeIcon as HTMLElement).style.display = visible ? 'block' : 'none';
    }
  }

  // Calculates and updates the panel position.
  private _updatePosition(): void {
    if (!this._targetElement || !this.element) {
      return;
    }

    // Register with position manager using enhanced PrimeNG-like positioning
    this.positionManager.register(
      this.id,
      this.element,
      this._targetElement,
      {
        position: this.position === 'auto' ? 'bottom' : this.position,
        offset: 5, // Default offset like PrimeNG
        constrainToViewport: true,
        autoFlip: true,
        followTrigger: false
      }
    );

    // Make sure panel is visible after positioning
    this.element.style.display = 'block';
  }

  // Handles clicks outside the panel.
  private _handleClickOutside(event: MouseEvent): void {
    if (this._animating) return;

    const clickedElement = event.target as HTMLElement;
    const isClickInside = this.element?.contains(clickedElement);
    const isClickOnTarget = this._targetElement?.contains(clickedElement);

    if (!isClickInside && !isClickOnTarget && this.dismissable) {
      this.hide();
    }
  }

  // Handles window resize events.
  private _handleWindowResize(): void {
    if (this.isVisible) {
      this._updatePosition();
    }
  }

  // Handle escape key (PrimeNG behavior)
  private _handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isVisible && this.dismissable) {
      this.hide();
      event.preventDefault();
    }
  }

  // Adds document event listeners.
  private _addListeners(): void {
    global.document.addEventListener('mousedown', this._clickOutsideHandler);
    global.window.addEventListener('resize', this._windowResizeHandler);
    global.window.addEventListener('scroll', this._windowResizeHandler, true);
    global.document.addEventListener('keydown', this._escapeKeyHandler);
  }

  // Removes document event listeners.
  private _removeListeners(): void {
    global.document.removeEventListener('mousedown', this._clickOutsideHandler);
    global.window.removeEventListener('resize', this._windowResizeHandler);
    global.window.removeEventListener('scroll', this._windowResizeHandler, true);
    global.document.removeEventListener('keydown', this._escapeKeyHandler);

    // Unregister from position manager
    this.positionManager.unregister(this.id);
  }

  // @inheritdoc
  override destroy(): void {
    // Hide the panel if visible
    if (this.isVisible) {
      this.set('isVisible', false);
    }

    this._removeListeners();

    // Remove from DOM if appended to body
    if (this.element && document.body.contains(this.element)) {
      try {
        // Return to original parent if possible
        if (this._originalParent && document.body.contains(this._originalParent)) {
          this._originalParent.appendChild(this.element);
        } else {
          this.element.remove();
        }
      } catch (e) {
        // Ignore errors if element is already removed
      }
    }

    super.destroy();
  }
}
