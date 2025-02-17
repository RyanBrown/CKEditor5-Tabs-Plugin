// src/plugins/ui-components/alight-overlay-panel-component/alight-overlay-panel.ts
import { AlightPositionManager, PositionConfig } from '../alight-ui-component-utils/alight-position-manager';
import './styles/alight-overlay-panel.scss';

interface PanelConfig extends PositionConfig {
  width?: string;
  height?: string;
  closeOnEsc?: boolean; // Add this line
}

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

  // The constructor now accepts either a string (selector) or an HTMLElement.
  constructor(trigger: string | HTMLElement, config?: PanelConfig) {
    this.positionManager = AlightPositionManager.getInstance();
    this._keydownHandler = this.handleKeydown.bind(this);

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

  // Add new method
  private handleKeydown(event: KeyboardEvent): void {
    if (this.currentPanel) {
      const panelId = this.currentPanel.getAttribute('data-id');
      const config = panelId ? this.configs.get(panelId) : undefined;
      if (event.key === 'Escape' && (config?.closeOnEsc ?? true)) {
        this.hidePanel(this.currentPanel);
      }
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
      // Move panel to body to prevent scroll issues
      document.body.appendChild(panel);

      panel.style.position = 'fixed';
      panel.style.display = 'none';

      this.panels.set(panelId, panel);

      const panelConfig: PanelConfig = {
        position: 'bottom',
        offset: 4,
        followTrigger: false,
        constrainToViewport: true,
        autoFlip: true,
        alignment: 'start',
        closeOnEsc: true, // Add default value
        width: panel.getAttribute('data-width') || defaultConfig?.width,
        height: panel.getAttribute('data-height') || defaultConfig?.height,
        ...defaultConfig
      };

      this.configs.set(panelId, panelConfig);
      this.applyConfig(panel, panelConfig);

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

    // Add keydown listener
    document.addEventListener('keydown', this._keydownHandler);
    // Global event listeners.
    document.addEventListener('click', (event: Event) => this.handleClickOutside(event));
  }


  // Update destroy/cleanup
  public destroy(): void {
    document.removeEventListener('keydown', this._keydownHandler);
    // Clean up other event listeners and resources
    this.panels.clear();
    this.configs.clear();
    this.currentPanel = null;
  }

  // Applies width and height settings.
  private applyConfig(panel: HTMLDivElement, config: PanelConfig): void {
    if (config.width) {
      panel.style.width = typeof config.width === 'number' ? `${config.width}px` : config.width;
    }
    if (config.height) {
      panel.style.height = typeof config.height === 'number' ? `${config.height}px` : config.height;
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

    const panelId = panel.getAttribute('data-id')!;
    const config = this.configs.get(panelId);

    if (config) {
      panel.style.display = 'block';

      // Force a layout recalculation
      panel.getBoundingClientRect();

      // Register with position manager
      requestAnimationFrame(() => {
        this.positionManager.register(panelId, panel, button, {
          ...config,
          followTrigger: false // Ensure panel doesn't follow scroll
        });
        panel.classList.add('cka-active');
      });

      this.currentPanel = panel;
    }
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
    const panelId = panel.getAttribute('data-id');
    if (panelId) {
      this.positionManager.unregister(panelId);
    }
    panel.classList.remove('cka-active');
    panel.style.display = 'none';
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

  // Public method to update a panel's config.
  public updatePanelConfig(panelId: string, config: Partial<PanelConfig>): void {
    const panel = this.panels.get(panelId);
    if (panel) {
      const currentConfig = this.configs.get(panelId) || {};
      const newConfig = { ...currentConfig, ...config };
      this.configs.set(panelId, newConfig);
      this.applyConfig(panel, newConfig);

      if (panel.classList.contains('cka-active')) {
        this.positionManager.updateConfig(panelId, newConfig);
      }
    }
  }
}
