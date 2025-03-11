// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel.ts
import { AlightPositionManager, PositionConfig } from '../alight-ui-component-utils/alight-position-manager';
import './styles/alight-overlay-panel.scss';

export interface PanelConfig extends PositionConfig {
  height?: string;
  maxHeight?: string;
  maxWidth?: string;
  minHeight?: string;
  minWidth?: string;
  width?: string;
  closeOnEsc?: boolean;
  dismissable?: boolean; // PrimeNG property: if true, clicking outside closes the panel
  showTransitionDuration?: number; // Animation durations like PrimeNG
  hideTransitionDuration?: number;
  onBeforeShow?: () => boolean | void; // PrimeNG-like lifecycle hooks
  onShow?: () => void;
  onBeforeHide?: () => boolean | void;
  onHide?: () => void;
  overlayPanelClass?: string;
  showCloseIcon?: boolean; // PrimeNG property
  appendTo?: 'body' | 'target' | HTMLElement; // PrimeNG appendTo option
  autoZIndex?: boolean; // PrimeNG property: auto manage z-index
  baseZIndex?: number; // PrimeNG property: base z-index to start from
  keepInViewport?: boolean; // PrimeNG property: ensure panel stays within viewport
}

type EventCallback = (event?: any) => void;
type EventMap = {
  [key: string]: EventCallback[];
};

export class AlightOverlayPanel {
  // Map of panel IDs to their DOM element.
  private panels: Map<string, HTMLDivElement> = new Map();
  private currentPanel: HTMLDivElement | null = null;
  private zIndex: number = 1000;
  private configs: Map<string, PanelConfig> = new Map();
  // Store the trigger element.
  private _trigger: HTMLElement | null = null;
  private positionManager: AlightPositionManager;
  private _keydownHandler: (event: KeyboardEvent) => void;
  private _clickOutsideHandler: (event: MouseEvent) => void;
  private eventListeners: EventMap = {};
  private _clickEventTarget: HTMLElement | null = null; // Track click target for PrimeNG behavior

  // The constructor now accepts either a string (selector) or an HTMLElement.
  constructor(trigger: string | HTMLElement, config?: PanelConfig) {
    this.positionManager = AlightPositionManager.getInstance();
    this._keydownHandler = this.handleKeydown.bind(this);
    this._clickOutsideHandler = this.handleClickOutside.bind(this);

    if (typeof trigger === 'string') {
      // Remove any leading '#' and look up the element.
      this._trigger = document.getElementById(trigger.replace(/^#/, ''));
    } else {
      this._trigger = trigger;
    }

    // Initialize with default config
    const defaultConfig: PanelConfig = {
      position: 'bottom',
      offset: 4,
      followTrigger: false,
      constrainToViewport: true,
      autoFlip: true,
      alignment: 'start',
      closeOnEsc: true,
      dismissable: true, // PrimeNG default
      appendTo: 'body', // PrimeNG default
      autoZIndex: true, // PrimeNG default
      baseZIndex: 0, // PrimeNG default
      keepInViewport: true, // PrimeNG default
      showTransitionDuration: 150,
      hideTransitionDuration: 150,
      ...config
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize(defaultConfig));
    } else {
      this.initialize(defaultConfig);
    }

    // Add document-level event listeners (PrimeNG behavior)
    document.addEventListener('keydown', this._keydownHandler);
    document.addEventListener('click', this._clickOutsideHandler);
  }

  // Add event listener method
  public on(eventName: string, callback: EventCallback): void {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
  }

  // Remove event listener method
  public off(eventName: string, callback: EventCallback): void {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName] = this.eventListeners[eventName].filter(
        cb => cb !== callback
      );
    }
  }

  // Trigger event method with optional data (PrimeNG behavior)
  private trigger(eventName: string, data?: any): void {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(callback => callback(data));
    }
  }

  // Public method to toggle panel (PrimeNG behavior)
  public toggle(event: Event, target?: HTMLElement): void {
    if (this.currentPanel) {
      this.hidePanel(this.currentPanel);
    } else {
      this.show(event, target || (event.currentTarget as HTMLElement));
    }
  }

  // Public show method (PrimeNG behavior)
  public show(event: Event, target?: HTMLElement): void {
    this._clickEventTarget = target || (event.currentTarget as HTMLElement) || this._trigger;

    // Store target for positioning
    if (!this._clickEventTarget) {
      console.warn('No target element for positioning');
      return;
    }

    // Get the panel ID from the trigger or target
    const panelId = this._clickEventTarget.getAttribute('data-panel-id') ||
      (this._trigger?.getAttribute('data-panel-id') || '');
    if (!panelId || !this.panels.has(panelId)) {
      console.warn(`No panel found with ID ${panelId}`);
      return;
    }

    const panel = this.panels.get(panelId)!;
    const config = this.configs.get(panelId)!;

    // Execute onBeforeShow hook (PrimeNG behavior)
    if (config.onBeforeShow && config.onBeforeShow() === false) {
      return; // Cancel show if hook returns false
    }

    // Hide any other visible panel first (PrimeNG behavior)
    if (this.currentPanel && this.currentPanel !== panel) {
      this.hidePanel(this.currentPanel);
    }

    // Prepare panel for display
    panel.style.display = 'none'; // Reset display before showing (PrimeNG behavior)
    panel.style.opacity = '0';

    // Handle appendTo option like PrimeNG
    if (config.appendTo) {
      if (config.appendTo === 'body') {
        document.body.appendChild(panel);
      } else if (config.appendTo === 'target' && this._clickEventTarget) {
        this._clickEventTarget.appendChild(panel);
      } else if (config.appendTo instanceof HTMLElement) {
        config.appendTo.appendChild(panel);
      }
    }

    // Show panel
    panel.style.display = 'block';

    // Trigger animation
    setTimeout(() => {
      panel.style.opacity = '1';
      panel.style.transition = `opacity ${config.showTransitionDuration || 150}ms`;
      panel.classList.add('cka-active');

      // Register with position manager for positioning
      this.positionManager.register(panelId, panel, this._clickEventTarget!, {
        ...config,
        followTrigger: false,
        constrainToViewport: config.keepInViewport
      });

      this.currentPanel = panel;

      // Trigger events
      this.trigger('show', { originalEvent: event, target: this._clickEventTarget });
      if (config.onShow) config.onShow();

      // Focus panel (PrimeNG behavior)
      setTimeout(() => {
        panel.focus();
      }, 0);
    }, 0);

    event.stopPropagation(); // Prevent event bubbling (PrimeNG behavior)
  }

  // Public close method (PrimeNG behavior)
  public hide(event?: Event): void {
    if (this.currentPanel) {
      this.hidePanel(this.currentPanel, event);
    }
  }

  // Hides a specific panel.
  public hidePanel(panel: HTMLDivElement, event?: Event): void {
    const panelId = panel.getAttribute('data-id');
    if (!panelId) return;

    const config = this.configs.get(panelId);
    if (!config) return;

    // Execute onBeforeHide hook (PrimeNG behavior)
    if (config.onBeforeHide && config.onBeforeHide() === false) {
      return; // Cancel hide if hook returns false
    }

    // Start fade-out animation
    panel.style.opacity = '0';
    panel.style.transition = `opacity ${config.hideTransitionDuration || 150}ms`;

    // Unregister from position manager
    this.positionManager.unregister(panelId);

    // Complete hide after animation
    setTimeout(() => {
      panel.classList.remove('cka-active');
      panel.style.display = 'none';

      // Trigger events
      this.trigger('hide', { originalEvent: event, target: this._clickEventTarget });
      if (config.onHide) config.onHide();

      if (this.currentPanel === panel) {
        this.currentPanel = null;
        this._clickEventTarget = null;
      }
    }, config.hideTransitionDuration || 150);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.currentPanel) {
      const panelId = this.currentPanel.getAttribute('data-id');
      const config = panelId ? this.configs.get(panelId) : undefined;
      if (event.key === 'Escape' && (config?.closeOnEsc ?? true)) {
        this.hidePanel(this.currentPanel);
        event.preventDefault(); // Prevent other escape handlers (PrimeNG behavior)
      }
    }
  }

  // Closes the panel if a click occurs outside.
  private handleClickOutside(event: MouseEvent): void {
    if (!this.currentPanel) return;

    const target = event.target as HTMLElement;
    const panelId = this.currentPanel.getAttribute('data-id');
    if (!panelId) return;

    const config = this.configs.get(panelId);
    if (!config) return;

    // Only close if dismissable is true (PrimeNG behavior)
    if (config.dismissable !== false) {
      const isClickInsidePanel = this.currentPanel.contains(target);
      const isClickOnTrigger = this._trigger?.contains(target) ||
        this._clickEventTarget?.contains(target);

      if (!isClickInsidePanel && !isClickOnTrigger) {
        this.hidePanel(this.currentPanel, event);
      }
    }
  }

  // Initializes the overlay panel.
  private initialize(defaultConfig: PanelConfig): void {
    if (!this._trigger) {
      console.warn(`Trigger button not found`);
      return;
    }
    // Get the panel id from the trigger's data attribute.
    const panelId = this._trigger.getAttribute('data-panel-id');
    if (!panelId) {
      console.warn(`No panel ID specified for trigger`);
      return;
    }

    // Find panel by ID
    const panel = document.querySelector(`.cka-overlay-panel[data-id="${panelId}"]`);
    if (panel instanceof HTMLDivElement) {
      // Prepare panel for positioning
      panel.style.position = 'absolute';
      panel.style.display = 'none';
      panel.style.zIndex = (defaultConfig.baseZIndex || this.zIndex).toString();

      this.panels.set(panelId, panel);

      // Merge default config with panel data attributes
      const panelConfig: PanelConfig = {
        ...defaultConfig,
        position: panel.getAttribute('data-position') as any || defaultConfig.position,
        width: panel.getAttribute('data-width') || defaultConfig.width,
        height: panel.getAttribute('data-height') || defaultConfig.height,
        dismissable: panel.hasAttribute('data-dismissable') ?
          panel.getAttribute('data-dismissable') !== 'false' :
          defaultConfig.dismissable,
        showCloseIcon: panel.hasAttribute('data-show-close-icon') ?
          panel.getAttribute('data-show-close-icon') === 'true' :
          defaultConfig.showCloseIcon
      };

      this.configs.set(panelId, panelConfig);
      this.applyConfig(panel, panelConfig);

      // Apply custom class if provided
      if (panelConfig.overlayPanelClass) {
        panel.classList.add(...panelConfig.overlayPanelClass.split(' '));
      }

      // Add close icon if configured (PrimeNG behavior)
      if (panelConfig.showCloseIcon) {
        this.addCloseIcon(panel, panelId);
      }

      // Setup trigger click handler (PrimeNG behavior)
      this._trigger.addEventListener('click', (event: Event) => this.toggle(event));

      // Setup focus/blur behavior (PrimeNG behavior)
      panel.setAttribute('tabindex', '-1'); // Make panel focusable
      panel.addEventListener('blur', () => {
        const config = this.configs.get(panelId);
        if (config?.dismissable !== false) {
          setTimeout(() => {
            // Check if focus is still within panel
            if (this.currentPanel === panel &&
              document.activeElement &&
              !panel.contains(document.activeElement)) {
              this.hidePanel(panel);
            }
          }, 0);
        }
      });
    } else {
      console.warn(`Panel with data-id="${panelId}" not found`);
      return;
    }

    // Set up close buttons within panel
    const closeButtons = document.querySelectorAll(`.cka-overlay-panel[data-id="${panelId}"] .cka-close-btn`);
    closeButtons.forEach((btn: Element) => {
      btn.addEventListener('click', (event: Event) => {
        event.stopPropagation();
        if (this.currentPanel) {
          this.hidePanel(this.currentPanel, event);
        }
      });
    });
  }

  // Add close icon like PrimeNG
  private addCloseIcon(panel: HTMLDivElement, panelId: string): void {
    // Check if close icon already exists
    if (panel.querySelector('.cka-overlay-panel-close-icon')) {
      return;
    }

    const closeIcon = document.createElement('button');
    closeIcon.className = 'cka-overlay-panel-close-icon cka-close-btn';
    closeIcon.setAttribute('type', 'button');
    closeIcon.setAttribute('aria-label', 'Close');

    // Create X icon
    const iconHtml = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z" fill="currentColor"/>
      </svg>
    `;
    closeIcon.innerHTML = iconHtml;

    // Add click handler
    closeIcon.addEventListener('click', (event: Event) => {
      event.stopPropagation();
      const panel = this.panels.get(panelId);
      if (panel) {
        this.hidePanel(panel, event);
      }
    });

    // Add to panel header or top-right
    panel.appendChild(closeIcon);
  }

  // Apply configuration to panel element - enhanced
  private applyConfig(panel: HTMLDivElement, config: PanelConfig): void {
    // Handle all dimension properties
    const dimensionProps: Record<string, string | undefined> = {
      'width': config.width,
      'height': config.height,
      'max-width': config.maxWidth,
      'max-height': config.maxHeight,
      'min-width': config.minWidth,
      'min-height': config.minHeight
    };

    // Apply each dimension property if it exists
    Object.entries(dimensionProps).forEach(([prop, value]) => {
      if (value !== undefined) {
        panel.style.setProperty(prop,
          typeof value === 'number' ? `${value}px` : value
        );
      }
    });

    // Apply z-index from config
    if (config.autoZIndex !== false) {
      const baseZIndex = config.baseZIndex || 0;
      panel.style.zIndex = (baseZIndex + this.positionManager.getNextZIndex()).toString();
    }

    // Add transition for animations
    panel.style.transition = `opacity ${config.showTransitionDuration || 150}ms`;
  }

  // Update destroy/cleanup method with proper PrimeNG cleanup
  public destroy(): void {
    // Remove global event listeners
    document.removeEventListener('keydown', this._keydownHandler);
    document.removeEventListener('click', this._clickOutsideHandler);

    // Hide any visible panel
    if (this.currentPanel) {
      this.hidePanel(this.currentPanel);
    }

    // Clean up all panels
    this.panels.forEach((panel, panelId) => {
      this.positionManager.unregister(panelId);

      // Remove event listeners from panel
      const closeButtons = panel.querySelectorAll('.cka-close-btn');
      closeButtons.forEach(btn => {
        btn.removeEventListener('click', event => this.hide(event));
      });

      // Return panel to original state
      panel.style.display = 'none';
      panel.style.position = '';
      panel.style.zIndex = '';
    });

    // Clean up trigger
    if (this._trigger) {
      const panelId = this._trigger.getAttribute('data-panel-id');
      // Remove click handler - using a different approach since we can't access the original handler
      const newTrigger = this._trigger.cloneNode(true);
      if (this._trigger.parentNode) {
        this._trigger.parentNode.replaceChild(newTrigger, this._trigger);
      }
    }

    // Clear all data structures
    this.panels.clear();
    this.configs.clear();
    this.currentPanel = null;
    this.eventListeners = {};
    this._trigger = null;
    this._clickEventTarget = null;
  }

  // Public method to update a panel's config - enhanced with PrimeNG options
  public updatePanelConfig(panelId: string, config: Partial<PanelConfig>): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      const currentConfig = this.configs.get(panelId) || {};

      // Handle custom class changes
      if (currentConfig.overlayPanelClass) {
        panel.classList.remove(...currentConfig.overlayPanelClass.split(' '));
      }

      const newConfig = { ...currentConfig, ...config };

      // Apply new custom classes if provided
      if (newConfig.overlayPanelClass) {
        panel.classList.add(...newConfig.overlayPanelClass.split(' '));
      }

      // Handle close icon changes
      if (newConfig.showCloseIcon !== currentConfig.showCloseIcon) {
        if (newConfig.showCloseIcon) {
          this.addCloseIcon(panel, panelId);
        } else {
          const closeIcon = panel.querySelector('.cka-overlay-panel-close-icon');
          if (closeIcon) {
            closeIcon.remove();
          }
        }
      }

      this.configs.set(panelId, newConfig);
      this.applyConfig(panel, newConfig);

      // Update position if panel is visible
      if (panel.classList.contains('cka-active')) {
        this.positionManager.updateConfig(panelId, newConfig);
      }
    }
  }
}
