// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel.ts

import './styles/alight-overlay-panel.scss';

interface PanelConfig {
  width?: string;
  height?: string;
}

export class AlightOverlayPanel {
  // Map of panel IDs to their DOM element.
  private panels: Map<string, HTMLDivElement> = new Map();
  private currentPanel: HTMLDivElement | null = null;
  private zIndex: number = 1000;
  private configs: Map<string, PanelConfig> = new Map();
  // Store the trigger element.
  private _trigger: HTMLElement | null = null;

  // The constructor now accepts either a string (selector) or an HTMLElement.
  constructor(trigger: string | HTMLElement, config?: PanelConfig) {
    if (typeof trigger === 'string') {
      // Remove any leading '#' and look up the element.
      this._trigger = document.getElementById(trigger.replace(/^#/, ''));
    } else {
      this._trigger = trigger;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize(config));
    } else {
      this.initialize(config);
    }
  }

  // Initializes the overlay panel.
  private initialize(defaultConfig?: PanelConfig): void {
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
    const panel = document.querySelector(`.cka-overlay-panel[data-id="${panelId}"]`);
    if (panel instanceof HTMLDivElement) {
      this.panels.set(panelId, panel);
      const panelConfig: PanelConfig = {
        width: panel.getAttribute('data-width') || defaultConfig?.width,
        height: panel.getAttribute('data-height') || defaultConfig?.height,
      };
      this.configs.set(panelId, panelConfig);
      this.applyConfig(panel, panelConfig);

      // Add click listener to the trigger element.
      this._trigger.addEventListener('click', (event: Event) => this.toggle(event));
    } else {
      console.warn(`Panel with data-id="${panelId}" not found`);
      return;
    }

    // Set up close buttons.
    const closeButtons = document.querySelectorAll(`.cka-overlay-panel[data-id="${panelId}"] .cka-close-btn`);
    closeButtons.forEach((btn: Element) => {
      btn.addEventListener('click', (event: Event) => this.hide(event));
    });

    // Global event listeners.
    document.addEventListener('click', (event: Event) => this.handleClickOutside(event));
    window.addEventListener('resize', () => this.handleWindowResize());
    window.addEventListener('scroll', () => this.handleWindowResize(), true);
  }

  // Applies width and height settings.
  private applyConfig(panel: HTMLDivElement, config: PanelConfig): void {
    if (config.width) {
      panel.style.width = config.width;
    }
    if (config.height) {
      panel.style.height = config.height;
    }
  }

  // Toggles the panel open or closed.
  private toggle(event: Event): void {
    event.stopPropagation();
    const button = event.currentTarget as HTMLButtonElement;
    const panelId = button.getAttribute('data-panel-id');
    if (!panelId || !this.panels.has(panelId)) return;
    const panel = this.panels.get(panelId)!;
    if (panel.classList.contains('cka-active')) {
      this.hidePanel(panel);
    } else {
      this.show(button, panel);
    }
  }

  // Shows the panel, positioning it relative to the trigger.
  private show(button: HTMLButtonElement, panel: HTMLDivElement): void {
    if (this.currentPanel && this.currentPanel !== panel) {
      this.hidePanel(this.currentPanel);
    }
    const rect = button.getBoundingClientRect();
    this.zIndex += 1;
    panel.style.zIndex = this.zIndex.toString();
    panel.classList.add('cka-active');
    this.positionPanel(panel, {
      x: rect.left,
      y: rect.bottom,
      targetHeight: rect.height,
      targetWidth: rect.width
    });
    this.currentPanel = panel;
  }

  // Positions the panel relative to the trigger button.
  private positionPanel(panel: HTMLDivElement, target: { x: number; y: number; targetHeight: number; targetWidth: number }): void {
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = target.x;
    let top = target.y;

    if (left + panelRect.width > viewportWidth) {
      left = target.x + target.targetWidth - panelRect.width;
    }
    if (top + panelRect.height > viewportHeight) {
      top = target.y - panelRect.height - target.targetHeight;
    }
    left = Math.max(0, Math.min(left, viewportWidth - panelRect.width));
    top = Math.max(0, Math.min(top, viewportHeight - panelRect.height));
    const absoluteLeft = left + window.pageXOffset;
    const absoluteTop = top + window.pageYOffset;
    panel.style.top = `${absoluteTop}px`;
    panel.style.left = `${absoluteLeft}px`;
  }

  // Hides the panel when a close event occurs.
  private hide(event: Event): void {
    event.stopPropagation();
    const closeButton = event.target as HTMLElement;
    const panel = closeButton.closest('.cka-overlay-panel') as HTMLDivElement;
    if (panel) {
      this.hidePanel(panel);
    }
  }

  // Hides a specific panel.
  public hidePanel(panel?: HTMLDivElement): void {
    if (!panel) {
      if (this.currentPanel) {
        panel = this.currentPanel;
      } else {
        return;
      }
    }
    panel.classList.remove('cka-active');
    if (this.currentPanel === panel) {
      this.currentPanel = null;
    }
  }

  // Closes the panel if a click occurs outside.
  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.currentPanel && !this.currentPanel.contains(target) && !this._trigger?.contains(target)) {
      this.hidePanel(this.currentPanel);
    }
  }

  // Repositions the panel on window resize or scroll.
  private handleWindowResize(): void {
    if (this.currentPanel) {
      const panelId = this.currentPanel.getAttribute('data-id');
      if (!panelId) return;
      const button = document.querySelector(`[data-panel-id='${panelId}']`) as HTMLButtonElement;
      if (button) {
        this.show(button, this.currentPanel);
      }
    }
  }

  // Public method to update a panel's config.
  public updatePanelConfig(panelId: string, config: Partial<PanelConfig>): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      const currentConfig = this.configs.get(panelId) || {};
      const newConfig = { ...currentConfig, ...config };
      this.configs.set(panelId, newConfig);
      this.applyConfig(panel, newConfig);
    }
  }
}
