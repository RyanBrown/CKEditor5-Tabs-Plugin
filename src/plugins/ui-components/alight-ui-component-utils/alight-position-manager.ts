// src/plugins/ui-components/alight-ui-component-utils/alight-position-manager.ts

/**
 * This file contains the AlightPositionManager class along with the Positionable decorator factory.
 * The positioning logic has been updated to more closely mirror PrimeNG's overlay positioning functionality.
 */

interface PositionableElement extends HTMLElement {
  _positionCleanup?: () => void;
}

export interface PositionConfig {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: number;
  followTrigger?: boolean;
  constrainToViewport?: boolean;
  autoFlip?: boolean; // New: if true, automatically flip the overlay when there is not enough space.
  alignment?: 'start' | 'center' | 'end';
  width?: string | number;
  height?: string | number;
  margin?: number;
  zIndex?: number;
}

export class AlightPositionManager {
  private static instance: AlightPositionManager;
  private components: Map<string, {
    element: PositionableElement,
    trigger: HTMLElement,
    config: PositionConfig,
    cleanup?: () => void
  }> = new Map();
  private zIndexCounter: number = 1000;

  private constructor() {
    window.addEventListener('scroll', this.updateAllPositions.bind(this), true);
    window.addEventListener('resize', this.updateAllPositions.bind(this));
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
    let parent = element.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Calculates the position of the overlay element relative to its trigger.
   * The logic now includes an "autoFlip" feature similar to PrimeNG.
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

    // Helper to compute aligned horizontal/vertical positions based on alignment setting.
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

    // Initial calculation based on the requested position.
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
      case 'center':
        top = (window.innerHeight - elementRect.height) / 2 + scrollY;
        left = (window.innerWidth - elementRect.width) / 2 + scrollX;
        break;
    }

    // Auto-flip logic (mirroring PrimeNG behavior)
    if (config.autoFlip) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Vertical auto-flip for top and bottom positions
      if (requestedPosition === 'bottom' && (top + elementRect.height > viewportHeight + scrollY)) {
        // Not enough space below; flip to top.
        top = triggerRect.top - elementRect.height - margin + scrollY;
      } else if (requestedPosition === 'top' && (top < scrollY)) {
        // Not enough space above; flip to bottom.
        top = triggerRect.bottom + margin + scrollY;
      }

      // Horizontal auto-flip for left and right positions
      if (requestedPosition === 'right' && (left + elementRect.width > viewportWidth + scrollX)) {
        // Not enough space on the right; flip to left.
        left = triggerRect.left - elementRect.width - margin + scrollX;
      } else if (requestedPosition === 'left' && (left < scrollX)) {
        // Not enough space on the left; flip to right.
        left = triggerRect.right + margin + scrollX;
      }
    }

    // Constrain the overlay within the viewport or its scroll parent's bounds if needed.
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
    const { top, left } = this.calculatePosition(trigger, element, config);

    element.style.position = 'absolute';
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;

    if (config.width) {
      element.style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    }
    if (config.height) {
      element.style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
    }
    if (config.zIndex) {
      element.style.zIndex = config.zIndex.toString();
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
   */
  public register(
    id: string,
    element: PositionableElement,
    trigger: HTMLElement,
    config: PositionConfig = {}
  ): void {
    // Unregister any existing component with the same id to avoid duplicates.
    this.unregister(id);

    if (!config.zIndex) {
      config.zIndex = this.zIndexCounter++;
    }

    this.components.set(id, { element, trigger, config });

    if (config.followTrigger) {
      let rafId: number | null = null;

      // Use a requestAnimationFrame loop to continuously update the position if followTrigger is enabled.
      const updateLoop = () => {
        this.updatePosition(id);
        rafId = requestAnimationFrame(updateLoop);
      };

      // Cleanup function to cancel the animation frame when the component is unregistered.
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
   * Unregisters a component, cleaning up any ongoing position updates.
   */
  public unregister(id: string): void {
    const component = this.components.get(id);
    if (component) {
      if (component.cleanup) {
        component.cleanup();
      }
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
      this.updatePosition(id);
    }
  }

  /**
   * Returns the next available z-index.
   */
  public getNextZIndex(): number {
    return this.zIndexCounter++;
  }
}

// Decorator factory for auto-positioning.
// Note: The properties 'positionManager' and 'componentId' are public so they can be accessed externally.
// An explicit constructor is added to bind the methods to the instance.
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
