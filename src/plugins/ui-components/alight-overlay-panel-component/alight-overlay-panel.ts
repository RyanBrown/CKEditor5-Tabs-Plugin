// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel.ts

import './styles/alight-overlay-panel.scss';

interface PanelConfig {
  width?: string;
  height?: string;
}

export class AlightOverlayPanel {
  private panels: Map<string, HTMLDivElement> = new Map();
  private currentPanel: HTMLDivElement | null = null;
  private zIndex: number = 1000;
  private configs: Map<string, PanelConfig> = new Map();
  private triggerId: string;

  constructor(triggerId: string, config?: PanelConfig) {
    this.triggerId = triggerId;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize(config));
    } else {
      this.initialize(config);
    }
  }

  private initialize(defaultConfig?: PanelConfig): void {
    // Get trigger button by ID
    const triggerButton = document.getElementById(this.triggerId);
    if (!triggerButton) {
      console.warn(`Trigger button with ID '${this.triggerId}' not found`);
      return;
    }

    // Find associated panel using data-panel-id attribute
    const panelId = triggerButton.getAttribute('data-panel-id');
    if (!panelId) {
      console.warn(`No panel ID specified for trigger '${this.triggerId}'`);
      return;
    }

    const panel = document.querySelector(`.cka-overlay-panel[data-id="${panelId}"]`);
    if (panel instanceof HTMLDivElement) {
      this.panels.set(panelId, panel);

      // Get panel-specific config from data attributes
      const panelConfig: PanelConfig = {
        width: panel.getAttribute('data-width') || defaultConfig?.width,
        height: panel.getAttribute('data-height') || defaultConfig?.height,
      };

      this.configs.set(panelId, panelConfig);
      this.applyConfig(panel, panelConfig);

      // Add click listener to trigger button
      triggerButton.addEventListener('click', (event: Event) => this.toggle(event));
    }

    // Set up close buttons
    const closeButtons = document.querySelectorAll(
      `.cka-overlay-panel[data-id="${panelId}"] .cka-close-btn`
    );
    closeButtons.forEach((btn: Element) => {
      btn.addEventListener('click', (event: Event) => this.hide(event));
    });

    // Global event listeners
    document.addEventListener('click', (event: Event) => this.handleClickOutside(event));
    window.addEventListener('resize', () => this.handleWindowResize());
    window.addEventListener('scroll', () => this.handleWindowResize(), true);
  }

  private applyConfig(panel: HTMLDivElement, config: PanelConfig): void {
    // Apply width and height if provided
    if (config.width) {
      panel.style.width = config.width;
    }
    if (config.height) {
      panel.style.height = config.height;
    }
  }

  private toggle(event: Event): void {
    event.stopPropagation();
    const button = event.currentTarget as HTMLButtonElement;
    const panelId = button.getAttribute('data-panel-id');

    if (!panelId || !this.panels.has(panelId)) return;

    const panel = this.panels.get(panelId)!;
    const config = this.configs.get(panelId);

    if (panel.classList.contains('cka-active')) {
      // Now calls our new public hidePanel():
      this.hidePanel(panel);
    } else {
      if (config) {
        this.applyConfig(panel, config);
      }
      this.show(button, panel);
    }
  }

  private show(button: HTMLButtonElement, panel: HTMLDivElement): void {
    if (this.currentPanel && this.currentPanel !== panel) {
      this.hidePanel(this.currentPanel);
    }

    // Get the latest button position
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

  private positionPanel(
    panel: HTMLDivElement,
    target: { x: number; y: number; targetHeight: number; targetWidth: number }
  ): void {
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position relative to viewport
    let left = target.x;
    let top = target.y;

    // Adjust for right overflow
    if (left + panelRect.width > viewportWidth) {
      left = target.x + target.targetWidth - panelRect.width;
    }

    // Adjust for bottom overflow
    if (top + panelRect.height > viewportHeight) {
      top = target.y - panelRect.height - target.targetHeight;
    }

    // Ensure panel stays within viewport bounds
    left = Math.max(0, Math.min(left, viewportWidth - panelRect.width));
    top = Math.max(0, Math.min(top, viewportHeight - panelRect.height));

    // Convert viewport coordinates to absolute positions
    const absoluteLeft = left + window.pageXOffset;
    const absoluteTop = top + window.pageYOffset;

    // Apply the position
    panel.style.top = `${absoluteTop}px`;
    panel.style.left = `${absoluteLeft}px`;
  }

  private hide(event: Event): void {
    event.stopPropagation();
    const closeButton = event.target as HTMLElement;
    const panel = closeButton.closest('.cka-overlay-panel') as HTMLDivElement;
    if (panel) {
      this.hidePanel(panel);
    }
  }

  // Make this public and optionally accept the panel:
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

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      this.currentPanel &&
      !this.currentPanel.contains(target) &&
      target.id !== this.triggerId
    ) {
      this.hidePanel(this.currentPanel);
    }
  }

  private handleWindowResize(): void {
    if (this.currentPanel) {
      const panelId = this.currentPanel.getAttribute('data-id');
      if (!panelId) return;

      const button = document.querySelector(`[data-panel-id='${panelId}']`) as HTMLButtonElement;
      if (button) {
        // Re-position based on the current button position
        this.show(button, this.currentPanel);
      }
    }
  }

  // Public method to update config for a specific panel
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
