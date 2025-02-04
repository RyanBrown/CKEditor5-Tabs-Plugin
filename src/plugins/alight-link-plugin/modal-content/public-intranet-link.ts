// src/plugins/alight-link-plugin/modal-content/public-intranet-link.ts
import { ILinkManager } from './ILinkManager';

export class PublicIntranetLinkManager implements ILinkManager {
  private container: HTMLElement | null = null;
  private currentPage: number = 1;

  constructor(
    private existingHref: string = '',
    private isIntranet: boolean = false,
    private existingOrgName: string = ''
  ) { }

  getLinkContent(page: number): string {
    this.currentPage = page;

    const intranetNote = this.isIntranet
      ? `
          <p><strong>Note:</strong> When an employee clicks on an intranet link, 
           a message will let them know they need to be connected 
           to that network to successfully continue.</p>
        `
      : '';

    return `
      <div class="public-intranet-link-content">
        ${intranetNote}
        
        <label for="url" class="cka-input-label">URL</label>
        <input
          id="url"
          type="url"
          class="cka-input-text"
          value="${this.escapeHtml(this.existingHref)}"
        />
        
        <label for="org-name" class="cka-input-label">
          Organization Name (Optional)<span class="asterisk">*</span>
        </label>
        <input
          id="org-name"
          type="text"
          class="cka-input-text"
          value="${this.escapeHtml(this.existingOrgName)}"
        />
        
        <p>
          <span class="asterisk">*</span>
          Enter the third-party organization to inform users the destination of the link.
        </p>
      </div>
    `;
  }

  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.getLinkContent(this.currentPage);

    // Add event listeners for form inputs
    const urlInput = container.querySelector('#url') as HTMLInputElement;
    const orgNameInput = container.querySelector('#org-name') as HTMLInputElement;

    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        this.existingHref = (e.target as HTMLInputElement).value;
      });
    }

    if (orgNameInput) {
      orgNameInput.addEventListener('input', (e) => {
        this.existingOrgName = (e.target as HTMLInputElement).value;
      });
    }
  }

  resetSearch(): void {
    this.existingHref = '';
    this.existingOrgName = '';
    if (this.container) {
      this.renderContent(this.container);
    }
  }

  // Helper method to prevent XSS
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Getters for form values
  getUrl(): string {
    return this.existingHref;
  }

  getOrgName(): string {
    return this.existingOrgName;
  }

  getIsIntranet(): boolean {
    return this.isIntranet;
  }
}