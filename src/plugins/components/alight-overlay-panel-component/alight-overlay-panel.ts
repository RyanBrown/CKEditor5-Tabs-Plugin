// src/plugins/alight-overlay-panel/alight-overlay-panel.ts
import './styles/alight-overlay-panel.scss';

export class AlightOverlayPanel {
  private buttons: NodeListOf<HTMLButtonElement>;
  private panels: NodeListOf<HTMLDivElement>;
  private currentPanel: HTMLDivElement | null = null;

  constructor() {
    this.buttons = document.querySelectorAll(".ck-alight-triggerBtn") as NodeListOf<HTMLButtonElement>;
    this.panels = document.querySelectorAll(".ck-alight-overlay-panel") as NodeListOf<HTMLDivElement>;

    this.buttons.forEach((button) => {
      button.addEventListener("click", (event: MouseEvent) => this.toggle(event));
    });

    // Use type casting to resolve TypeScript typing issue
    document.addEventListener("click", this.handleClickOutside as EventListener);

    document.querySelectorAll(".ck-alight-closeBtn").forEach((closeBtn) => {
      closeBtn.addEventListener("click", this.hide as EventListener);
    });

    window.addEventListener("resize", () => this.handleWindowResize());
  }

  private toggle(event: MouseEvent): void {
    event.stopPropagation(); // Prevent event from bubbling to document

    const button = event.currentTarget as HTMLButtonElement;
    const panelId = button.getAttribute("data-id");

    if (!panelId) return;

    const panel = document.querySelector(`.ck-alight-overlay-panel[data-id='${panelId}']`) as HTMLDivElement | null;

    if (!panel) return;

    panel.classList.contains("ck-alight-active") ? this.hidePanel(panel) : this.show(button, panel);
  }

  private show(button: HTMLButtonElement, panel: HTMLDivElement): void {
    if (this.currentPanel && this.currentPanel !== panel) {
      this.hidePanel(this.currentPanel);
    }

    const rect = button.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    panel.style.maxHeight = "90vh";
    panel.style.maxWidth = "90vw";
    panel.style.width = "auto";
    panel.style.height = "auto";

    panel.classList.add("ck-alight-active");
    panel.style.opacity = "0";
    panel.style.visibility = "hidden";

    const updatedPanelRect = panel.getBoundingClientRect();

    let top: number, left: number;

    if (windowHeight - rect.bottom >= updatedPanelRect.height) {
      top = rect.bottom;
    } else if (rect.top >= updatedPanelRect.height) {
      top = rect.top - updatedPanelRect.height;
    } else {
      top = Math.max(10, rect.top - updatedPanelRect.height);
    }

    if (windowWidth - rect.right >= updatedPanelRect.width) {
      left = rect.left;
    } else if (rect.left >= updatedPanelRect.width) {
      left = rect.right - updatedPanelRect.width;
    } else {
      left = Math.max(10, Math.min(rect.left, windowWidth - updatedPanelRect.width - 10));
    }

    top = Math.max(10, Math.min(top, windowHeight - updatedPanelRect.height - 10));
    left = Math.max(10, Math.min(left, windowWidth - updatedPanelRect.width - 10));

    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;

    void panel.offsetWidth;

    panel.style.opacity = "1";
    panel.style.visibility = "visible";

    this.currentPanel = panel;
  }

  private hide(event: Event): void {
    event.stopPropagation();
    const closeButton = event.target as HTMLElement;
    const panel = closeButton.closest(".ck-alight-overlay-panel") as HTMLDivElement | null;
    if (panel) {
      this.hidePanel(panel);
    }
  }

  private hidePanel(panel: HTMLDivElement): void {
    panel.style.opacity = "0";
    panel.style.visibility = "hidden";
    panel.classList.remove("ck-alight-active");
    if (this.currentPanel === panel) {
      this.currentPanel = null;
    }
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".ck-alight-overlay-panel") && !target.closest(".ck-alight-triggerBtn")) {
      this.panels.forEach((panel) => {
        this.hidePanel(panel);
      });
    }
  }

  private handleWindowResize(): void {
    if (this.currentPanel) {
      const panelId = this.currentPanel.getAttribute("data-id");
      const button = panelId ? document.querySelector(`.ck-alight-triggerBtn[data-id='${panelId}']`) as HTMLButtonElement | null : null;
      if (button) {
        this.show(button, this.currentPanel);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AlightOverlayPanel();
});
