import './popover.scss';

export class VanillaPopover {
  target: HTMLElement | null;
  content: string;
  trigger: "click" | "hover";
  placement: "top" | "bottom" | "left" | "right";
  popover: HTMLDivElement | null;

  constructor(options: { target: string; content?: string; trigger?: "click" | "hover"; placement?: "top" | "bottom" | "left" | "right" }) {
    this.target = document.querySelector(options.target);
    this.content = options.content || "Popover content";
    this.trigger = options.trigger || "click";
    this.placement = options.placement || "right";
    this.popover = null;
    this.init();
  }

  private init(): void {
    if (!this.target) {
      console.error("Target element not found");
      return;
    }
    this.createPopover();
    this.attachEvents();
  }

  private createPopover(): void {
    this.popover = document.createElement("div");
    this.popover.className = "vanilla-popover";
    this.popover.innerHTML = `<div class="popover-arrow"></div><div class="popover-content">${this.content}</div>`;
    document.body.appendChild(this.popover);
  }

  private attachEvents(): void {
    if (!this.target) return;
    if (this.trigger === "click") {
      this.target.addEventListener("click", () => this.togglePopover());
      document.addEventListener("click", (e) => this.handleOutsideClick(e));
    } else if (this.trigger === "hover") {
      this.target.addEventListener("mouseenter", () => this.showPopover());
      this.target.addEventListener("mouseleave", () => this.hidePopover());
    }
  }

  private togglePopover(): void {
    if (this.popover && this.popover.style.display === "block") {
      this.hidePopover();
    } else {
      this.showPopover();
    }
  }

  private showPopover(): void {
    if (!this.target || !this.popover) return;
    const rect = this.target.getBoundingClientRect();
    this.popover.style.display = "block";
    this.setPosition(rect);
  }

  private hidePopover(): void {
    if (this.popover) {
      this.popover.style.display = "none";
    }
  }

  private setPosition(rect: DOMRect): void {
    if (!this.popover) return;
    const popoverRect = this.popover.getBoundingClientRect();
    let top: number, left: number;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    switch (this.placement) {
      case "top":
        top = rect.top - popoverRect.height - 5;
        left = rect.left + rect.width / 2 - popoverRect.width / 2;
        if (top < 0) top = rect.bottom + 5; // Adjust if out of view
        break;
      case "bottom":
        top = rect.bottom + 5;
        left = rect.left + rect.width / 2 - popoverRect.width / 2;
        if (top + popoverRect.height > windowHeight) top = rect.top - popoverRect.height - 5;
        break;
      case "left":
        top = rect.top + rect.height / 2 - popoverRect.height / 2;
        left = rect.left - popoverRect.width - 5;
        if (left < 0) left = rect.right + 5; // Adjust if out of view
        break;
      case "right":
      default:
        top = rect.top + rect.height / 2 - popoverRect.height / 2;
        left = rect.right + 5;
        if (left + popoverRect.width > windowWidth) left = rect.left - popoverRect.width - 5;
        break;
    }

    // Ensure popover is within bounds
    if (left < 0) left = 5;
    if (left + popoverRect.width > windowWidth) left = windowWidth - popoverRect.width - 5;
    if (top < 0) top = 5;
    if (top + popoverRect.height > windowHeight) top = windowHeight - popoverRect.height - 5;

    this.popover.style.top = `${top}px`;
    this.popover.style.left = `${left}px`;
  }

  private handleOutsideClick(event: Event): void {
    if (!this.target || !this.popover) return;
    if (!this.target.contains(event.target as Node) && !this.popover.contains(event.target as Node)) {
      this.hidePopover();
    }
  }
}

// Example usage in a TypeScript file
// import { VanillaPopover } from './VanillaPopover';
// new VanillaPopover({
//     target: "#advanced-search", // Replacing with popover for advanced search
//     content: "Advanced Search Options", // Popover content
//     trigger: "click",
//     placement: "bottom"
// });
