// src/plugins/ui-components/alight-ui-component-utils/alight-position-manager.ts

/**
 * This file contains the AlightPositionManager class along with the Positionable decorator factory.
 * The positioning logic has been updated to more closely mirror PrimeNG's overlay positioning functionality.
 */

interface PositionableElement extends HTMLElement {
  _positionCleanup?: () => void;
}

export interface PositionConfig {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  offset?: number;
  followTrigger?: boolean;
  constrainToViewport?: boolean;
  autoFlip?: boolean;
  alignment?: 'start' | 'center' | 'end';
  width?: string | number;
  height?: string | number;
  margin?: number;
  zIndex?: number;
  appendTo?: 'body' | 'target' | HTMLElement; // PrimeNG-like appendTo option
}

export class AlightPositionManager {
  private static instance: AlightPositionManager;
  private components: Map<string, {
    element: PositionableElement,
    trigger: HTMLElement,
    config: PositionConfig,
    cleanup?: () => void,
    originalParent?: HTMLElement // Store original parent for proper cleanup
  }> = new Map();
  private zIndexCounter: number = 1000;
  private activeComponents: Set<string> = new Set(); // Track active components for proper z-index stacking

  private constructor() {
    // Use capture phase for scroll to catch all scroll events
    window.addEventListener('scroll', this.updateAllPositions.bind(this), true);
    window.addEventListener('resize', this.updateAllPositions.bind(this));

    // Handle tab/window focus events (similar to PrimeNG)
    window.addEventListener('focus', this.updateAllPositions.bind(this));
  }

  public static getInstance(): AlightPositionManager {
    if (!AlightPositionManager.instance) {
      AlightPositionManager.instance = new AlightPositionManager();
    }
    return AlightPositionManager.instance;
  }

  /**
   * Returns the first scrollable parent of the given element.
   */
  private getScrollParent(element: HTMLElement): HTMLElement | null {
    if (!element) return document.body;

    // Start with the parent element
    let parent = element.parentElement;
    while (parent) {
      const { overflowY, overflowX } = window.getComputedStyle(parent);
      // Check for both X and Y overflow like PrimeNG does
      if (
        (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
        (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth)
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }

    // If no scrollable parent found, return document.body
    return document.body;
  }

  /**
   * Calculates the position of the overlay element relative to its trigger.
   * The logic now fully matches PrimeNG's positioning system.
   */
  private calculatePosition(
    trigger: HTMLElement,
    element: HTMLElement,
    config: PositionConfig
  ): { top: number; left: number } {
    const triggerRect = trigger.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const margin = config.offset || 0;

    let top = 0;
    let left = 0;
    const requestedPosition = config.position || 'bottom';

    // Helper to compute aligned horizontal/vertical positions based on alignment setting
    const getAlignedPosition = (primaryPos: number, size: number, targetSize: number): number => {
      switch (config.alignment) {
        case 'start':
          return primaryPos;
        case 'end':
          return primaryPos + targetSize - size;
        case 'center':
        default:
          return primaryPos + (targetSize - size) / 2;
      }
    };

    // Calculate position based on requested position including compound positions (top-left, etc.)
    switch (requestedPosition) {
      case 'top':
        top = triggerRect.top - elementRect.height - margin + scrollY;
        left = getAlignedPosition(triggerRect.left, elementRect.width, triggerRect.width) + scrollX;
        break;
      case 'bottom':
        top = triggerRect.bottom + margin + scrollY;
        left = getAlignedPosition(triggerRect.left, elementRect.width, triggerRect.width) + scrollX;
        break;
      case 'left':
        left = triggerRect.left - elementRect.width - margin + scrollX;
        top = getAlignedPosition(triggerRect.top, elementRect.height, triggerRect.height) + scrollY;
        break;
      case 'right':
        left = triggerRect.right + margin + scrollX;
        top = getAlignedPosition(triggerRect.top, elementRect.height, triggerRect.height) + scrollY;
        break;
      case 'top-left':
        top = triggerRect.top - elementRect.height - margin + scrollY;
        left = triggerRect.left + scrollX;
        break;
      case 'top-right':
        top = triggerRect.top - elementRect.height - margin + scrollY;
        left = triggerRect.right - elementRect.width + scrollX;
        break;
      case 'bottom-left':
        top = triggerRect.bottom + margin + scrollY;
        left = triggerRect.left + scrollX;
        break;
      case 'bottom-right':
        top = triggerRect.bottom + margin + scrollY;
        left = triggerRect.right - elementRect.width + scrollX;
        break;
      case 'center':
        top = (window.innerHeight - elementRect.height) / 2 + scrollY;
        left = (window.innerWidth - elementRect.width) / 2 + scrollX;
        break;
    }

    // Auto-flip logic (full PrimeNG implementation)
    if (config.autoFlip) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Store original position for "flipping back" logic
      const originalPosition = requestedPosition;
      let adjustedPosition = originalPosition;

      // Vertical auto-flip for top and bottom positions
      if ((originalPosition === 'bottom' || originalPosition === 'bottom-left' || originalPosition === 'bottom-right') &&
        (top + elementRect.height > viewportHeight + scrollY)) {
        // Not enough space below; flip to top
        top = triggerRect.top - elementRect.height - margin + scrollY;
        adjustedPosition = originalPosition === 'bottom' ? 'top' :
          originalPosition === 'bottom-left' ? 'top-left' : 'top-right';
      } else if ((originalPosition === 'top' || originalPosition === 'top-left' || originalPosition === 'top-right') &&
        (top < scrollY)) {
        // Not enough space above; flip to bottom
        top = triggerRect.bottom + margin + scrollY;
        adjustedPosition = originalPosition === 'top' ? 'bottom' :
          originalPosition === 'top-left' ? 'bottom-left' : 'bottom-right';
      }

      // Horizontal auto-flip for left and right positions
      if ((originalPosition === 'right' || originalPosition === 'top-right' || originalPosition === 'bottom-right') &&
        (left + elementRect.width > viewportWidth + scrollX)) {
        // Not enough space on the right; flip to left
        if (originalPosition === 'right') {
          left = triggerRect.left - elementRect.width - margin + scrollX;
          adjustedPosition = 'left';
        } else {
          left = triggerRect.left + scrollX;
          adjustedPosition = originalPosition === 'top-right' ? 'top-left' : 'bottom-left';
        }
      } else if ((originalPosition === 'left' || originalPosition === 'top-left' || originalPosition === 'bottom-left') &&
        (left < scrollX)) {
        // Not enough space on the left; flip to right
        if (originalPosition === 'left') {
          left = triggerRect.right + margin + scrollX;
          adjustedPosition = 'right';
        } else {
          left = triggerRect.right - elementRect.width + scrollX;
          adjustedPosition = originalPosition === 'top-left' ? 'top-right' : 'bottom-right';
        }
      }

      // If position was adjusted, store this on the element for styling purposes
      if (adjustedPosition !== originalPosition) {
        element.setAttribute('data-flipped', 'true');
        element.setAttribute('data-flipped-to', adjustedPosition);
      } else {
        element.removeAttribute('data-flipped');
        element.removeAttribute('data-flipped-to');
      }
    }

    // Constrain the overlay within the viewport or its scroll parent's bounds if needed
    if (config.constrainToViewport) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollParent = this.getScrollParent(trigger);
      const parentRect = scrollParent?.getBoundingClientRect() || {
        top: 0,
        right: viewportWidth,
        bottom: viewportHeight,
        left: 0
      };

      // Apply constraints like PrimeNG
      left = Math.max(
        parentRect.left + scrollX,
        Math.min(left, parentRect.right + scrollX - elementRect.width)
      );
      top = Math.max(
        parentRect.top + scrollY,
        Math.min(top, parentRect.bottom + scrollY - elementRect.height)
      );
    }

    return { top, left };
  }

  /**
   * Updates the position of a registered overlay component.
   */
  private updatePosition(id: string): void {
    const component = this.components.get(id);
    if (!component) return;

    const { element, trigger, config } = component;

    // Check if elements still exist in the DOM
    if (!document.body.contains(element) || !document.body.contains(trigger)) {
      this.unregister(id);
      return;
    }

    const { top, left } = this.calculatePosition(trigger, element, config);

    // Apply position
    element.style.position = 'absolute';
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;

    // Apply dimensions if specified
    if (config.width) {
      element.style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    }
    if (config.height) {
      element.style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
    }

    // Apply z-index (ensure active component is always on top)
    if (this.activeComponents.has(id)) {
      element.style.zIndex = (config.zIndex || this.zIndexCounter).toString();
    }
  }

  /**
   * Updates positions for all registered components.
   */
  private updateAllPositions(): void {
    this.components.forEach((_, id) => this.updatePosition(id));
  }

  /**
   * Registers an overlay component for auto-positioning.
   * Enhances PrimeNG's behavior with appendTo options and z-index management.
   */
  public register(
    id: string,
    element: PositionableElement,
    trigger: HTMLElement,
    config: PositionConfig = {}
  ): void {
    // Unregister any existing component with the same id to avoid duplicates
    this.unregister(id);

    // Store original parent for cleanup later
    const originalParent = element.parentElement;

    // Handle appendTo option like PrimeNG
    if (config.appendTo) {
      if (config.appendTo === 'body') {
        document.body.appendChild(element);
      } else if (config.appendTo === 'target' && trigger) {
        trigger.appendChild(element);
      } else if (config.appendTo instanceof HTMLElement) {
        config.appendTo.appendChild(element);
      }
    }

    // Manage z-index
    if (!config.zIndex) {
      config.zIndex = this.zIndexCounter++;
    }

    // Mark this component as active (for z-index stacking)
    this.activeComponents.add(id);

    // Ensure all other components have lower z-index
    this.components.forEach((component, componentId) => {
      if (componentId !== id && component.element) {
        component.element.style.zIndex = (Number(component.element.style.zIndex || 0) - 1).toString();
      }
    });

    this.components.set(id, { element, trigger, config, originalParent });

    if (config.followTrigger) {
      let rafId: number | null = null;

      // Use a requestAnimationFrame loop to continuously update the position if followTrigger is enabled
      const updateLoop = () => {
        this.updatePosition(id);
        rafId = requestAnimationFrame(updateLoop);
      };

      // Cleanup function to cancel the animation frame when the component is unregistered
      const cleanup = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };

      this.components.get(id)!.cleanup = cleanup;
      rafId = requestAnimationFrame(updateLoop);
    } else {
      this.updatePosition(id);
    }
  }

  /**
   * Unregisters a component, cleaning up any ongoing position updates and restoring DOM.
   */
  public unregister(id: string): void {
    const component = this.components.get(id);
    if (component) {
      if (component.cleanup) {
        component.cleanup();
      }

      // PrimeNG-like cleanup: restore element to original parent if it was moved
      if (component.originalParent &&
        component.element.parentElement !== component.originalParent &&
        document.body.contains(component.originalParent)) {
        try {
          component.originalParent.appendChild(component.element);
        } catch (e) {
          // Ignore errors if element is already removed
        }
      }

      // Remove from active components tracking
      this.activeComponents.delete(id);
      this.components.delete(id);
    }
  }

  /**
   * Updates the configuration of a registered component and repositions it.
   */
  public updateConfig(id: string, newConfig: Partial<PositionConfig>): void {
    const component = this.components.get(id);
    if (component) {
      component.config = { ...component.config, ...newConfig };

      // If z-index changed, update z-index stacking
      if (newConfig.zIndex && this.activeComponents.has(id)) {
        this.zIndexCounter = Math.max(this.zIndexCounter, newConfig.zIndex + 1);
      }

      this.updatePosition(id);
    }
  }

  /**
   * Returns the next available z-index.
   */
  public getNextZIndex(): number {
    return this.zIndexCounter++;
  }

  /**
   * Brings a component to the front of the z-index stack, like PrimeNG's overlay behavior.
   */
  public bringToFront(id: string): void {
    const component = this.components.get(id);
    if (component && component.element) {
      // Update z-index for this component
      const newZIndex = this.getNextZIndex();
      component.config.zIndex = newZIndex;
      component.element.style.zIndex = newZIndex.toString();

      // Mark as active
      this.activeComponents.add(id);
    }
  }
}

// Decorator factory for auto-positioning.
// Enhanced to match PrimeNG's positioning behavior including appendTo support
export function Positionable(config: PositionConfig = {}) {
  return function <T extends { new(...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      public positionManager: AlightPositionManager = AlightPositionManager.getInstance();
      public componentId: string = Math.random().toString(36).substr(2, 9);

      constructor(...args: any[]) {
        super(...args);
        // Bind methods to ensure correct context
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.destroy = this.destroy.bind(this);
      }

      show(...args: any[]) {
        if (super.show) {
          super.show(...args);
        }
        // Register the component with the position manager when shown,
        // ensuring that the required properties (element and trigger) are defined.
        if (this.element && this.trigger) {
          // Bring to front when shown (PrimeNG behavior)
          this.positionManager.bringToFront(this.componentId);

          this.positionManager.register(
            this.componentId,
            this.element,
            this.trigger,
            config
          );
        } else {
          console.warn('Element or trigger is not defined on this component.');
        }
      }

      hide(...args: any[]) {
        if (super.hide) {
          super.hide(...args);
        }
        if (this.positionManager) {
          this.positionManager.unregister(this.componentId);
        } else {
          console.warn('Position manager is not defined on this component.');
        }
      }

      destroy(...args: any[]) {
        if (this.positionManager) {
          this.positionManager.unregister(this.componentId);
        }
        if (super.destroy) {
          super.destroy(...args);
        }
      }
    }
  }
}
