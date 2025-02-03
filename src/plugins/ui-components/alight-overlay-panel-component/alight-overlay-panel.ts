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
    const closeButtons = document.querySelectorAll(`.cka-overlay-panel[data-id="${panelId}"] .cka-close-btn`);
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

    const rect = button.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.zIndex += 1;
    panel.style.zIndex = this.zIndex.toString();

    panel.classList.add('cka-active');

    this.positionPanel(panel, {
      x: rect.left + scrollLeft,
      y: rect.bottom + scrollTop,
      targetHeight: rect.height,
      targetWidth: rect.width
    });

    this.currentPanel = panel;
  }

  private positionPanel(panel: HTMLDivElement, target: { x: number; y: number; targetHeight: number; targetWidth: number }): void {
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = target.y;
    let left = target.x;

    if (left + panelRect.width > viewportWidth + scrollLeft) {
      left = target.x + target.targetWidth - panelRect.width;
    }

    if (top + panelRect.height > viewportHeight + scrollTop) {
      top = target.y - panelRect.height - target.targetHeight;
    }

    left = Math.max(scrollLeft, Math.min(left, viewportWidth + scrollLeft - panelRect.width));
    top = Math.max(scrollTop, Math.min(top, viewportHeight + scrollTop - panelRect.height));

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }

  private hide(event: Event): void {
    event.stopPropagation();
    const closeButton = event.target as HTMLElement;
    const panel = closeButton.closest('.cka-overlay-panel') as HTMLDivElement;
    if (panel) {
      this.hidePanel(panel);
    }
  }

  private hidePanel(panel: HTMLDivElement): void {
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
      const button = panelId
        ? document.querySelector(`.cka-trigger-btn[data-id='${panelId}']`) as HTMLButtonElement
        : null;

      if (button) {
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

// Example usage:
/*
<button id="advancedSearchTrigger" data-panel-id="advanced-search-panel">
  Advanced Search
</button>

<div class="cka-overlay-panel" data-id="advanced-search-panel">
  <!-- Panel content -->
</div>

const advancedSearchPanel = new AlightOverlayPanel('advancedSearchTrigger', {
  width: '400px'
});
*/