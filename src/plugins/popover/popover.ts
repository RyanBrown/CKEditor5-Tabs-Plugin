import './popover.scss';

export class VanillaPopover {
  target: HTMLElement | null;
  content: string;
  trigger: "click" | "hover";
  placement: "top" | "bottom" | "left" | "right";
  popover: HTMLDivElement | null;
  isVisible: boolean;

  constructor(options: { target: string; content?: string; trigger?: "click" | "hover"; placement?: "top" | "bottom" | "left" | "right" }) {
    this.target = document.querySelector(options.target) as HTMLElement;
    this.content = options.content || "Popover content";
    this.trigger = options.trigger || "click";
    this.placement = options.placement || "right";
    this.popover = null;
    this.isVisible = false;
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
    this.popover.innerHTML = `
            <div class="popover-header">
                <span class="popover-close">&times;</span>
            </div>
            <div class="popover-content" contenteditable="true">${this.content}</div>
        `;
    document.body.appendChild(this.popover);

    // Close button event
    this.popover.querySelector(".popover-close")?.addEventListener("click", () => this.hidePopover());

    this.popover.addEventListener("click", (e) => e.stopPropagation()); // Prevent popover from closing when clicked inside
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
    if (this.isVisible) {
      this.hidePopover();
    } else {
      this.showPopover();
    }
  }

  private showPopover(): void {
    if (!this.target || !this.popover) return;
    this.popover.style.display = "block";
    this.isVisible = true;
    this.setPosition();
  }

  private hidePopover(): void {
    if (this.popover) {
      this.popover.style.display = "none";
      this.isVisible = false;
    }
  }

  private setPosition(): void {
    if (!this.popover || !this.target) return;
    const targetRect = this.target.getBoundingClientRect();
    const popoverRect = this.popover.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top: number = targetRect.top + window.scrollY;
    let left: number = targetRect.left + window.scrollX;

    switch (this.placement) {
      case "top":
        top -= popoverRect.height + 5;
        left += (targetRect.width - popoverRect.width) / 2;
        break;
      case "bottom":
        top += targetRect.height + 5;
        left += (targetRect.width - popoverRect.width) / 2;
        break;
      case "left":
        top += (targetRect.height - popoverRect.height) / 2;
        left -= popoverRect.width + 5;
        break;
      case "right":
      default:
        top += (targetRect.height - popoverRect.height) / 2;
        left += targetRect.width + 5;
        break;
    }

    // Ensure popover is within viewport bounds
    if (left < 0) left = 5;
    if (left + popoverRect.width > windowWidth) left = windowWidth - popoverRect.width - 5;
    if (top < 0) top = 5;
    if (top + popoverRect.height > windowHeight) top = windowHeight - popoverRect.height - 5;

    this.popover.style.top = `${top}px`;
    this.popover.style.left = `${left}px`;
  }

  private handleOutsideClick(event: Event): void {
    if (!this.target || !this.popover) return;
    if (!this.popover.contains(event.target as Node) && !this.target.contains(event.target as Node)) {
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
